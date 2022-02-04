# Setup Box app users with AzureB2C
This configuration will allow you to use AzureB2C as the identity management solution for an demo application that use Box app users to login to Box. This will allow a user to register an email with AzureB2C and this will automatically create a Box app user and map it to the AzureB2C user. The app itself consists of a Box UI Element loaded as the app user logged in. 


See the below diagrams for details

Registration flow

<img src="/public/img/register.png" width="90%" height="90%">
        
Login flow

<img src="/public/img/login.png" width="90%" height="90%">


## Pre-requisites
You will need both a Azure free developer account and a Box account
- Azure Dev account: https://azure.microsoft.com/en-gb/free/
- Free Box Developer account: https://account.box.com/signup/developer

## Azure
1. Go to Azure portal

2. Create a new resource

    Choose 'Azure Active Directory B2C'
    
    Create a new Azure AD B2C Tenant
  
    Give it a meaningful name like 'box-b2c-demo' or similar
    
    Choose 'Create new resource group', again name it something like boxb2c
  
    After creation, go to 'Open B2C Tenant' (This opens in a new window)
    
3. Register a new application
   Go to 'App Registrations'-> New Registration
   Add a client secret (and copy the value as you will need it in the next section)

   
## Box

1. Create a new JWT Application https://developer.box.com/guides/authentication/jwt/jwt-setup/
  - App access level: App access only
  - Application scopes: Read, Write, Manage users, Manage groups
  - Advanced features: Generate user access tokens
  - CORS Domains: http://localhost:3000 

2. Download the json file with the private key
   This will be downloaded as json file with 12 lines. Remove all line ending to make it a single line
  
    From

    <img src="/images/multi.png" width="50%" height="50%">

    
    To
    
    <img src="/images/single.png" width="50%" height="50%">

## Setup and run the app

1. Clone this repository and create an '.env' file in the root and add the following key/value pairs
  -  B2C_CLIENT_ID=..from the settings page of your B2C App
  -  B2C_REDIRECT_URL=http://localhost:3000/auth/openid/return
  -  B2C_CLIENT_SECRET=..API Secret created above
  -  B2C_METADATA=https://login.microsoftonline.com/DOMAIN_OF_YOUR_B2C_TENANT/v2.0/.well-known/openid-configuration
  -  B2C_LOGOUT_URL=
  -  BOX_JWT=..jwt json config in a single line

  Get the domain of your tenant from the tenant landing page
  
  <img src="/images/domain.png" width="50%" height="50%">

  Get the client ID of your app from the app landing page
  
  <img src="/images/clientId.jpg" width="50%" height="50%">

2. Install dependencies

    npm install

3. Run the app

    npm start

    This should bring up this website on localhost:3000 and you can go through the registration process
  
    Welcome screen
    
    <img src="/images/screen.png" width="75%" height="75%">
    
    Registration (sign up)
    
    <img src="/images/register.png" width="50%" height="50%">
    
    <img src="/images/regcode.png" width="50%" height="50%">
    
    User mapping info
    
    <img src="/images/loggedin.png" width="100%" height="100%">    
    
    Folder created as the app user
    
    <img src="/images/folder.png" width="100%" height="100%">
    
    
# License
The MIT License (MIT)

Copyright (c) 2021 Peter Christensen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
