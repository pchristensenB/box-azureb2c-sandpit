# Setup Box app users with AzureB2C
This configuration will allow you to use AzureB2C as the identity management solution for an demo application that use Box app users to login to Box. This will allow a user to register an email with AzureB2C and this will automatically create a Box app user and map it to the AzureB2C user. The app itself consists of a Box UI Element loaded as the app user logged in. 


See the below diagrams for details

Registration flow

<img src="/public/img/register.png" width="75%" height="75%">
        
Login flow

<img src="/public/img/login.png" width="75%" height="75%">


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
    
    Create new resource group
  
    After creation, go to 'Open B2C Tenant' (This opens in a new window)
    
3. Register a new application
   Go to 'App Registraions'-> New Registration
   Add a client secret
   

    
# License
The MIT License (MIT)

Copyright (c) 2021 Peter Christensen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

