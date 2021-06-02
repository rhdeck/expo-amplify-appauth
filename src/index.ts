import { useCallback, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  makeRedirectUri,
  useAuthRequest,
  DiscoveryDocument,
  AuthRequestConfig,
} from "expo-auth-session";
import Auth, { CognitoUser } from "@aws-amplify/auth";
import { Hub, HubCallback } from "@aws-amplify/core";
import { Buffer } from "buffer";
import {
  CognitoAccessToken,
  CognitoIdToken,
  CognitoRefreshToken,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
//inputs from settings
const redirectUri = makeRedirectUri({ useProxy: true });

//Helper code for making events that look like they came from Amplify for ease of use
const AMPLIFY_SYMBOL = (
  typeof Symbol !== "undefined" && typeof Symbol.for === "function"
    ? Symbol.for("amplify_default")
    : "@@amplify_default"
) as Symbol;
const dispatchAuthEvent = (event: string, data: any, message: string) => {
  Hub.dispatch("auth", { event, data, message }, "Auth", AMPLIFY_SYMBOL);
};
//Initialize the authsession beause I will need it later
WebBrowser.maybeCompleteAuthSession();

/**
 *
 * @param config Options for initializing Amplify authentication using AppAuth in Expo
 * @returns
 */
export function useAmplifyAppAuth(config: {
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  endPoint?: string;
  domain?: string;
  region?: string;
  clientId: string;
  userPoolId: string;
  clientSecret?: string;
  /**
   * Oauth scopes (defaults to [openid], which is fine for most use cases)
   */
  scopes?: string[];
}) {
  let {
    authorizationEndpoint,
    clientId,
    clientSecret,
    domain,
    region,
    tokenEndpoint,
    userPoolId,
    endPoint,
    scopes = ["openid"],
  } = config;
  if (!authorizationEndpoint) {
    if (endPoint) {
      authorizationEndpoint = endPoint + "/login";
    } else if (domain && region) {
      authorizationEndpoint = `https://${domain}.auth.${region}.amazoncognito.com/login`;
    } else {
      throw new Error("Cannot figure out the authorization endpoint");
    }
  }
  if (!tokenEndpoint) {
    if (endPoint) {
      tokenEndpoint = endPoint + "/token";
    } else if (domain && region) {
      tokenEndpoint = `https://${domain}.auth.${region}.amazoncognito.com/token`;
    } else {
      throw new Error("Cannot figure out the authorization endpoint");
    }
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [currentUser, setCurrentUser] = useState<CognitoUser>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const listener: HubCallback = (event) => {
      if (event.payload.event === "signOut") {
        console.log("signing out now");
        setCurrentUser(undefined);
        setIsLoggedIn(false);
      }
    };
    Hub.listen("auth", listener);
    return () => {
      Hub.remove("auth", listener);
    };
  }, []);
  const discoveryDocument: DiscoveryDocument = {
    authorizationEndpoint,
    tokenEndpoint,
  };
  const authSetup: AuthRequestConfig = {
    clientId,
    usePKCE: true,
    scopes,
    responseType: "code",
    redirectUri,
    clientSecret,
  };
  const [request, response, promptAsync] = useAuthRequest(
    authSetup,
    discoveryDocument
  );
  useEffect(() => {
    if (response) {
      setLoading(true);
      if (response.type === "error") {
        setError(response.error?.description);
        return;
      }
      if (response.type === "success") {
        const body = new URLSearchParams({
          grant_type: "authorization_code",
          client_id: authSetup.clientId,
          code: response.params.code,
          redirect_uri: authSetup.redirectUri,
          code_verifier: request!.codeVerifier!,
        });
        fetch(discoveryDocument.tokenEndpoint!, {
          method: "POST",
          headers: {
            ...(clientSecret
              ? {
                  Authorization: `Basic ${Buffer.from(
                    `${clientId}:${clientSecret}`
                  ).toString("base64")}`,
                }
              : {}),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }).then(
          async (response) => {
            const { id_token, refresh_token, access_token, error } =
              (await response.json()) as {
                id_token: string;
                refresh_token: string;
                access_token: string;
                error: string;
              };
            if (error) {
              setError(error);
            } else {
              const session = new CognitoUserSession({
                IdToken: new CognitoIdToken({ IdToken: id_token }),
                RefreshToken: new CognitoRefreshToken({
                  RefreshToken: refresh_token,
                }),
                AccessToken: new CognitoAccessToken({
                  AccessToken: access_token,
                }),
              });
              //@ts-ignore
              const _currentUser = Auth.createCognitoUser(
                session.getIdToken().decodePayload()["cognito:username"]
              );
              const currentUser = _currentUser as CognitoUser;
              currentUser.setSignInUserSession(session);
              const user = await Auth.currentAuthenticatedUser();
              dispatchAuthEvent(
                "signIn",
                currentUser,
                `A user ${user.getUsername()} has been signed in`
              );
            }
            setLoading(false);
            setCurrentUser(currentUser);
            setIsLoggedIn(true);
          },
          (error) => {
            setError(error);
            setLoading(false);
          }
        );
      }
    }
  }, [response]);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const user = await Auth.currentAuthenticatedUser();
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (e) {
        console.log("guess not");
        console.log("Here is an error thathappend to me", e);
      }
      setLoading(false);
    })();
  }, []);
  const doPromptAsync = useCallback(
    (...args) => {
      if (loading) throw new Error("cannot prompt while loading");
      return promptAsync(...args);
    },
    [promptAsync, loading]
  );
  return {
    promptAsync: doPromptAsync,
    loading,
    error,
    currentUser,
    isLoggedIn,
  };
}
export default useAmplifyAppAuth;
