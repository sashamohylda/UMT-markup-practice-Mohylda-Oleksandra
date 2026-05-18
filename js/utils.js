export function extractErrorMessage(error, fallbackMessage = "Something went wrong. Please try again later.") {
  const serverMessage = error.response?.data?.error;
  if (typeof serverMessage === "string") {
    return serverMessage;
  }
  if (error.message) {
    return error.message;
  }
  return fallbackMessage;
}