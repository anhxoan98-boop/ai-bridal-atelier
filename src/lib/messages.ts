/** Customer-facing copy for failures. Wording is part of the product spec. */
export const MESSAGES = {
  uploadFailed: 'Unable to upload this image. Please try again.',
  aiFailed: "We couldn't create this version. Your previous design is safe.",
  editFailed:
    'Something went wrong while editing your dress. Your previous version has been preserved.',
  aiNotConfigured:
    'AI service not configured. The design studio is ready, but no AI provider has been connected yet.',
  saveFailed: "We couldn't save your design right now. Nothing has been lost — please try again.",
  loadFailed: "We couldn't open this design. Please try again.",
} as const
