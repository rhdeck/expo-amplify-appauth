
<a name="readmemd"></a>

Template for making easy-to-work-with tempates

# expo-amplify-appauth

## The Problem

AppAuth is awesome! It works great getting an authentication code for AWS Cognito! Then things break down. This package wraps AppAuth `promptAsync` pattern to automatically populate the `Auth` and `Credentials` objects from AWS Amplify front-end components to allow seamless communication with Cognito-authenticated AWS services.

This has been tested on user pools, but not identity pools. 



<a name="_librarymd"></a>

expo-amplify-appauth - v1.0.0

# expo-amplify-appauth - v1.0.0

## Table of contents

### References

- [default](#default)

### Functions

- [useAmplifyAppAuth](#useamplifyappauth)

## References

### default

Renames and exports: [useAmplifyAppAuth](#useamplifyappauth)

## Functions

### useAmplifyAppAuth

▸ **useAmplifyAppAuth**(`config`): `Object`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | `Object` | Options for initializing Amplify authentication using AppAuth in Expo |
| `config.authorizationEndpoint?` | `string` | - |
| `config.clientId` | `string` | - |
| `config.clientSecret?` | `string` | - |
| `config.domain?` | `string` | - |
| `config.endPoint?` | `string` | - |
| `config.region?` | `string` | - |
| `config.scopes?` | `string`[] | Oauth scopes (defaults to [openid], which is fine for most use cases) |
| `config.tokenEndpoint?` | `string` | - |
| `config.userPoolId` | `string` | - |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `currentUser` | `undefined` \| `CognitoUser` |
| `error` | `undefined` \| `string` |
| `isLoggedIn` | `boolean` |
| `loading` | `boolean` |
| `promptAsync` | (...`args`: `any`[]) => `Promise`<AuthSessionResult\> |

#### Defined in

[index.ts:38](https://github.com/rhdeck/expo-amplify-appauth/blob/cdae79f/src/index.ts#L38)
