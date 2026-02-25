import { COGNITO_DOMAIN, COGNITO_CLIENT_ID, REDIRECT_URI } from "./cognitoConfig";

export function redirectToCognitoLogin() {
  const loginUrl =
    `${COGNITO_DOMAIN}/oauth2/authorize?` +
    `response_type=code` +
    `&client_id=${COGNITO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=openid+profile+email`;
  // alert(loginUrl);
  window.location.href = loginUrl;
}