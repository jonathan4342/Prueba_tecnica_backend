export interface RegisterView {
  id: string;
  email: string;
  message: string;
}

export interface LoginView {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
}
