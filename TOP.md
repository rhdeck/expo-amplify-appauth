Template for making easy-to-work-with tempates

# expo-amplify-appauth

## The Problem

AppAuth is awesome! It works great getting an authentication code for AWS Cognito! Then things break down. This package wraps AppAuth `promptAsync` pattern to automatically populate the `Auth` and `Credentials` objects from AWS Amplify front-end components to allow seamless communication with Cognito-authenticated AWS services.

This has been tested on user pools, but not identity pools. 

