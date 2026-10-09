import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";

const baseURL = API_BASE_URL;

export async function loginUser(credentials) {
  const response = await axios.post(
    `${baseURL}/auth/api/re_calculator/login`,
    credentials
  );
  return response.data;
}

export async function sendRegisterAdminOtp(payload) {
  const response = await axios.post(
    `${baseURL}/auth/api/re_calculator/sendRegisterAdminOtp`,
    payload
  );
  return response.data;
}

export async function verifyRegisterAdminOtp(payload) {
  const response = await axios.post(
    `${baseURL}/auth/api/re_calculator/verifyRegisterAdminOtp`,
    payload
  );
  return response.data;
}

export async function registerAdminWithOtp(payload) {
  const response = await axios.post(
    `${baseURL}/auth/api/re_calculator/registerAdminWithOtp`,
    payload
  );
  return response.data;
}

export async function sendForgotPasswordOtp(payload) {
  const response = await axios.post(
    `${baseURL}/auth/api/re_calculator/forgot-password`,
    payload
  );
  return response.data;
}

export async function resetPassword(payload) {
  const response = await axios.post(
    `${baseURL}/auth/api/re_calculator/reset-password`,
    payload
  );
  return response.data;
}

export async function verifyOtpForgot(payload) {
  const response = await axios.post(
    `${baseURL}/auth/api/re_calculator/verifyOTP-forgot`,
    payload
  );
  return response.data;
}

export async function registerBD(payload, token) {
  const response = await axios.post(
    `${baseURL}/auth/api/re_calculator/register`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}
