
require('dotenv').config()

const box = require('box-node-sdk');
// jwt-decode v4 uses default export
const { jwtDecode } = require('jwt-decode');

const boxAppSettings=process.env.BOX_JWT;

let serviceAccountClient;
let session = box.getPreconfiguredInstance(JSON.parse(boxAppSettings));
serviceAccountClient = session.getAppAuthClient('enterprise');

/******************************************************************************
 * Module dependencies.
 *****************************************************************************/
var express = require('express');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var methodOverride = require('method-override');
var passport = require('passport');
var config = require('./config');



// Start QuickStart here

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;


/******************************************************************************
 * Set up passport in the app 
 ******************************************************************************/

//-----------------------------------------------------------------------------
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.  Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
//-----------------------------------------------------------------------------
passport.serializeUser(function(user, done) {
  done(null, user.oid);
});

passport.deserializeUser(function(oid, done) {
  console.log("calling from deser");

  findByOid(oid, function (err, user) {
    done(err, user);
  });
});

// array to hold logged in users
var users = [];

var findByOid = function(oid, fn) {
  console.log('findByOid called with:', oid);
  console.log('Current users array length:', users.length);
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    console.log('Checking user:', {
      index: i,
      oid: user.oid,
      sub: user.sub,
      name: user.name || user.displayName
    });
    // Check both oid and sub for matching
    if (user.oid === oid || user.sub === oid) {
      console.log('Found matching user at index:', i);
      return fn(null, user);
    }
  }
  console.log('No matching user found for oid:', oid);
  return fn(null, null);
};

//-----------------------------------------------------------------------------
// Use the OIDCStrategy within Passport.
// 
// Strategies in passport require a `verify` function, which accepts credentials
// (in this case, the `oid` claim in id_token), and invoke a callback to find
// the corresponding user object.
// 
// The following are the accepted prototypes for the `verify` function
// (1) function(iss, sub, done)
// (2) function(iss, sub, profile, done)
// (3) function(iss, sub, profile, access_token, refresh_token, done)
// (4) function(iss, sub, profile, access_token, refresh_token, params, done)
// (5) function(iss, sub, profile, jwtClaims, access_token, refresh_token, params, done)
// (6) prototype (1)-(5) with an additional `req` parameter as the first parameter
//
// To do prototype (6), passReqToCallback must be set to true in the config.
//-----------------------------------------------------------------------------
passport.use(new OIDCStrategy({
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    redirectUrl: config.creds.redirectUrl,
    allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
    clientSecret: config.creds.clientSecret,
    validateIssuer: config.creds.validateIssuer,
    isB2C: config.creds.isB2C,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    scope: config.creds.scope,
    loggingLevel: config.creds.loggingLevel,
    nonceLifetime: config.creds.nonceLifetime,
    nonceMaxAmount: config.creds.nonceMaxAmount,
    useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
    cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
    clockSkew: config.creds.clockSkew,
  },
  function(iss, sub, profile, accessToken, refreshToken, done) {
    console.log("Passport verify callback called");
    console.log("  iss:", iss);
    console.log("  sub:", sub);
    console.log("  profile:", profile ? JSON.stringify(profile, null, 2) : 'no profile');
    console.log("  profile.oid:", profile ? profile.oid : 'no profile');
    console.log("  profile.sub:", profile ? profile.sub : 'no profile');
    console.log("  has accessToken:", !!accessToken);
    console.log("  has refreshToken:", !!refreshToken);
    
    if (!profile) {
      console.error("No profile object received");
      return done(new Error("No profile received from Azure B2C"), null);
    }
    
    // Azure B2C uses 'oid' for object ID, but fallback to 'sub' if oid is not present
    var userOid = profile.oid || profile.sub || profile._json?.oid || profile._json?.sub;
    
    if (!userOid) {
      console.error("No oid or sub found in profile");
      console.error("Profile keys:", Object.keys(profile));
      if (profile._json) {
        console.error("Profile._json keys:", Object.keys(profile._json));
      }
      return done(new Error("No oid or sub found in profile"), null);
    }
    
    // Ensure profile has oid property for consistency
    if (!profile.oid && userOid) {
      profile.oid = userOid;
    }
    
    console.log("Using user identifier (oid/sub):", userOid);
    
    // asynchronous verification, for effect...
    process.nextTick(function () {
      console.log("calling from passport - findByOid");
      findByOid(userOid, function(err, user) {
        if (err) {
          console.error("Error in findByOid:", err);
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          console.log("Creating new user profile for oid:", userOid);
          users.push(profile);
          return done(null, profile);
        } 
        else {
          console.log("Found existing user for oid:", userOid);
          return done(null, user);
        }
        
      });
    });
  }
));


//-----------------------------------------------------------------------------
// Config the app, include middlewares
//-----------------------------------------------------------------------------
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(methodOverride());
app.use(cookieParser());
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

var jsonParser = express.json()
var urlencodedParser = express.urlencoded({ extended: false });

app.use(expressSession({ 
  secret: 'keyboard cat', 
  resave: true, 
  saveUninitialized: false,
  // Store passport error messages in session
  name: 'connect.sid'
}));

app.use(express.urlencoded({ extended : true }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'))

//-----------------------------------------------------------------------------
// Set up the route controller
//
// 1. For 'login' route and 'returnURL' route, use `passport.authenticate`. 
// This way the passport middleware can redirect the user to login page, receive
// id_token etc from returnURL.
//
// 2. For the routes you want to check if user is already logged in, use 
// `ensureAuthenticated`. It checks if there is an user stored in session, if not
// it will call `passport.authenticate` to ask for user to log in.
//-----------------------------------------------------------------------------
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};
app.get('/azureb2c.js', function(req, res) {
  console.log
  res.render('azureb2c', { user: req.user });
});

app.get('/', function(req, res) {
  console.log
  res.render('index', { user: req.user });
});

app.post('/', function(req, res) {
  console.log
  res.render('index', { user: req.user });
});
app.get('/login',
  function(req, res, next) {
    passport.authenticate('azuread-openidconnect', 
      { 
        response: res,                      // required
        resourceURL: config.resourceURL,    // optional. Provide a value if you want to specify the resource.
        customState: 'my_state',            // optional. Provide a value if you want to provide custom state value.
        failureRedirect: '/fail' 
      }
    )(req, res, next);
  },
  function(req, res) {
    res.redirect('/');
});
app.post('/boxUI', urlencodedParser, function (req, res) {
  console.log("tok:" + req.body.userId);
  console.log("tok:" + JSON.stringify(req.body));
  let azId= req.body.userId;
	getAppUserID(azId)
		.then((appUserID) => {
			//If the box user is not present in AZURE, throw error
			if (!appUserID || appUserID=='NOTFOUND') {
				res.json({error: "some error"});
			}
			else {
				console.log(`App User ID is: ${appUserID.id}`);
				session.getAppUserTokens(appUserID.id).then(function(accessToken) {
					console.log("the access token is: " + accessToken);
					res.json({
            accessToken: accessToken.accessToken,
						azId:azId,
						userName:appUserID.name,
						login:appUserID.login,
						extId:appUserID.extId,
						boxId:appUserID.id
          });
				})
			}
		});
});
// 'GET returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// query (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.get('/auth/openid/return',
  function(req, res, next) {
    passport.authenticate('azuread-openidconnect', 
      { 
        response: res,                      // required
        failureRedirect: '/fail'  
      }
    )(req, res, next);
  },
  function(req, res) {
    console.log('We received a return from AzureAD.' + JSON.stringify(req.body));
    res.redirect('/');
  });

// 'POST returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// body (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.post('/auth/openid/return',
  function(req, res, next) {
    console.log('POST /auth/openid/return - Request received');
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Has code:', !!req.body.code);
    console.log('Has id_token:', !!req.body.id_token);
    console.log('Has error:', !!req.body.error);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
    // Check for Azure AD error response first
    if (req.body.error) {
      console.error('Azure AD returned an error:', req.body.error);
      console.error('Error description:', req.body.error_description);
      return res.redirect('/fail?error=' + encodeURIComponent(req.body.error) + '&description=' + encodeURIComponent(req.body.error_description || ''));
    }
    
    // Use custom callback to capture errors
    passport.authenticate('azuread-openidconnect', 
      { 
        response: res                      // required
      },
      function(err, user, info) {
        if (err) {
          console.error('Passport authentication error:', err);
          console.error('Error stack:', err.stack);
          console.error('Error message:', err.message);
          console.error('Info object:', JSON.stringify(info, null, 2));
          
          // Try to extract more details from the error
          var errorMessage = err.message || 'Unknown authentication error';
          var errorCode = err.code || 'authentication_failed';
          
          // Check if it's an authorization code redemption error
          if (err.message && err.message.includes('redeem authorization code')) {
            errorCode = 'authorization_code_redemption_failed';
            errorMessage = 'Failed to redeem authorization code. Check client secret and redirect URL configuration.';
          }
          
          return res.redirect('/fail?error=' + encodeURIComponent(errorCode) + '&message=' + encodeURIComponent(errorMessage));
        }
        
        if (!user) {
          console.error('Authentication failed - no user returned');
          console.error('Error object:', err);
          console.error('Info object:', JSON.stringify(info, null, 2));
          console.error('Info type:', typeof info);
          console.error('Request body:', JSON.stringify(req.body, null, 2));
          console.error('Request session:', req.session ? Object.keys(req.session) : 'no session');
          
          // If authorization code redemption failed but we have an id_token, try to use it directly
          if (req.body && req.body.id_token && (info === 'In _authCodeFlowHandler: failed to redeem authorization code' || 
              (typeof info === 'string' && info.includes('failed to redeem authorization code')))) {
            console.log('Authorization code redemption failed, but id_token is available. Attempting to use id_token directly...');
            try {
              var decoded = jwtDecode(req.body.id_token);
              console.log('Decoded id_token:', JSON.stringify(decoded, null, 2));
              console.log('Decoded id_token oid:', decoded.oid);
              console.log('Decoded id_token sub:', decoded.sub);
              
              // Create a user object from the id_token
              var userFromToken = {
                oid: decoded.oid || decoded.sub,
                sub: decoded.sub,
                name: decoded.name,
                displayName: decoded.name,
                emails: decoded.emails || [],
                id_token: req.body.id_token
              };
              
              // Store in users array
              findByOid(userFromToken.oid, function(findErr, existingUser) {
                if (!existingUser) {
                  users.push(userFromToken);
                }
                
                // Log in the user
                req.logIn(userFromToken, function(loginErr) {
                  if (loginErr) {
                    console.error('Error logging in user from id_token:', loginErr);
                    return res.redirect('/fail?error=login_failed&message=' + encodeURIComponent(loginErr.message || 'Unknown login error'));
                  }
                  console.log('Successfully logged in user using id_token fallback');
                  return next();
                });
              });
              return; // Exit early, we're handling the login
            } catch (decodeErr) {
              console.error('Error decoding id_token for fallback:', decodeErr);
            }
          }
          
          var failMessage = (info && info.message) ? info.message : 
                           (typeof info === 'string' ? info : 'Authentication failed - no user returned from passport verify callback');
          return res.redirect('/fail?error=no_user&message=' + encodeURIComponent(failMessage));
        }
        
        console.log('User returned from passport:', {
          oid: user.oid,
          sub: user.sub,
          name: user.name || user.displayName,
          hasProfile: !!user
        });
        
        // Log in the user
        req.logIn(user, function(loginErr) {
          if (loginErr) {
            console.error('Error logging in user:', loginErr);
            return res.redirect('/fail?error=login_failed&message=' + encodeURIComponent(loginErr.message || 'Unknown login error'));
          }
          return next();
        });
      }
    )(req, res, next);
  },
  function(req, res) {
    console.log('We received a return from AzureAD. - create here!' + JSON.stringify(req.body));
    
    // Check if user is authenticated
    if (!req.user) {
      console.error('No user in request after authentication');
      return res.redirect('/fail?error=no_user_authenticated');
    }
    
    // Try to get id_token from body first, then from user object
    var idToken = req.body.id_token;
    if (!idToken && req.user && req.user.id_token) {
      idToken = req.user.id_token;
    }
    
    if (!idToken) {
      console.error('No id_token available');
      console.error('Request body:', JSON.stringify(req.body));
      console.error('Request user:', JSON.stringify(req.user));
      return res.redirect('/fail?error=no_id_token');
    }
    
    try {
      var decoded = jwtDecode(idToken);
      console.log("DEC:" + JSON.stringify(decoded));
      console.log("OID:" + decoded.oid + "::" + decoded.name);
      
      // Use oid or sub for Azure B2C user ID
      var azureUserId = decoded.oid || decoded.sub;
      if (!azureUserId) {
        console.error('No oid or sub in decoded token');
        return res.redirect('/fail?error=no_user_id_in_token');
      }
      
      getAppUserID(azureUserId).then((appuserId) => {
        if(appuserId=='NOTFOUND') {
          createAppUser(azureUserId, decoded.name || decoded.email || 'Unknown User').then((appUserID) => {
            console.log("created:" + appUserID);
            res.redirect('/');
          }).catch((err) => {
            console.error('Error creating app user:', err);
            res.redirect('/fail?error=user_creation_failed&message=' + encodeURIComponent(err.message || 'Unknown error'));
          });
        }
        else {
          console.log("found:" + appuserId);
          res.redirect('/');
        }
      }).catch((err) => {
        console.error('Error getting app user ID:', err);
        res.redirect('/fail?error=user_lookup_failed&message=' + encodeURIComponent(err.message || 'Unknown error'));
      });
    } catch (err) {
      console.error('Error decoding JWT:', err);
      res.redirect('/fail?error=jwt_decode_failed&message=' + encodeURIComponent(err.message || 'Unknown error'));
    }
  });

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get('/logout', function(req, res){
  //req.session.destroy(function(err) {
  //  req.logOut();
  //  res.redirect(config.destroySessionUrl);
  //});
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect(config.destroySessionUrl);
  });
});
app.get('/fail', function(req, res){
  // Check for passport error messages in session
  var sessionMessages = [];
  if (req.session && req.session.messages) {
    sessionMessages = req.session.messages;
    // Clear messages after reading
    req.session.messages = [];
  }
  
  const error = req.query.error || (sessionMessages.length > 0 ? 'passport_error' : 'unknown_error');
  const message = req.query.message || req.query.description || (sessionMessages.length > 0 ? sessionMessages[0] : 'Authentication failed');
  const info = req.query.info;
  
  console.error('Authentication failure:', {
    error: error,
    message: message,
    info: info,
    query: req.query,
    sessionMessages: sessionMessages,
    sessionId: req.sessionID,
    body: req.body,
    headers: req.headers
  });
  
  res.status(500).json({
    error: "Authentication failed",
    details: {
      error: error,
      message: message,
      info: info ? JSON.parse(decodeURIComponent(info)) : null,
      sessionMessages: sessionMessages,
      query: req.query,
      troubleshooting: {
        checkClientSecret: "Verify B2C_CLIENT_SECRET in .env matches Azure B2C exactly (escape backslashes as \\\\)",
        checkRedirectUrl: "Verify B2C_REDIRECT_URL exactly matches Azure B2C App Registration redirect URL",
        checkMetadata: "Verify B2C_METADATA URL is correct and accessible",
        commonIssues: [
          "Authorization codes are single-use - if you refresh, start a new login",
          "Client secret may contain special characters that need escaping",
          "Redirect URL must match exactly (including http/https, port, trailing slashes)"
        ]
      }
    }
  });
});
// Global error handler middleware
app.use(function(err, req, res, next) {
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('Request body:', req.body);
  
  // If it's an authentication error, redirect to fail page
  if (req.url && req.url.includes('/auth/openid/return')) {
    return res.redirect('/fail?error=unhandled_error&message=' + encodeURIComponent(err.message || 'Unknown error'));
  }
  
  res.status(500).json({
    error: "Internal server error",
    message: err.message || 'Unknown error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server started on port', port);
  console.log('Environment check:');
  console.log('  B2C_CLIENT_ID:', process.env.B2C_CLIENT_ID ? 'Set' : 'NOT SET');
  console.log('  B2C_CLIENT_SECRET:', process.env.B2C_CLIENT_SECRET ? 'Set (' + process.env.B2C_CLIENT_SECRET.length + ' chars)' : 'NOT SET');
  console.log('  B2C_REDIRECT_URL:', process.env.B2C_REDIRECT_URL || 'NOT SET');
  console.log('  B2C_METADATA:', process.env.B2C_METADATA ? 'Set' : 'NOT SET');
});
const createAppUser = (azId,name) =>   {
  console.log(azId + ":" + name);
  return serviceAccountClient.enterprise.addAppUser(name, { "is_platform_access_only": true,"external_app_user_id":azId }).then((result) => {
    console.log(result);
      
        return result.id;
      }
    );
}
const getAppUserID = (azId) => {
  console.log("Finding extID:" + azId);
  return serviceAccountClient.enterprise.getUsers({ "external_app_user_id": azId,"fields":"id,name,login,external_app_user_id" })
      .then((result) => {
          console.log(result);
          if (result.total_count > 0) {
            return {id:result.entries[0].id,name:result.entries[0].name,login:result.entries[0].login,extId:result.entries[0].external_app_user_id};
          }
          else {
            return "NOTFOUND";
          }
      });
}