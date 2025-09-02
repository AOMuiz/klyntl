export interface CreateAvatarUrlArgs {
  /** Can be the user's name or the imgSrc. */
  avatarUrl: string;
  /** @see https://ui-avatars.com/ for additional properties. */
  additionalParams?: Record<string, string | number>;
}

/**
 * Creates an avatar URL using UI Avatars service
 * @param args Configuration for the avatar
 * @returns Avatar URL string
 */
export const createAvatarUrl = (args: CreateAvatarUrlArgs) => {
  const { avatarUrl: url, additionalParams } = args;

  if (url?.includes("http")) return url;

  const params = new URLSearchParams();
  params.append("name", url);
  params.append("size", "512");

  // Default vibrant styling for Klyntl - Professional palette
  params.append("background", "059669"); // Emerald primary
  params.append("color", "FFFFFF"); // White text
  params.append("font-size", "0.6");
  params.append("rounded", "1");

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.append(key, String(value));
    });
  }

  return `https://ui-avatars.com/api.jpg?${params.toString()}`;
};

/**
 * Creates a themed avatar URL with predefined Klyntl color schemes
 * @param name User's name for avatar generation
 * @param theme Color theme ('primary', 'secondary', 'accent', 'success', 'warning')
 * @param size Avatar size in pixels (default: 100)
 * @returns Themed avatar URL string
 */
export const createThemedAvatarUrl = (
  name: string,
  theme: "primary" | "secondary" | "accent" | "success" | "warning" = "primary",
  size: number = 100
) => {
  const themeColors = {
    primary: { bg: "059669", text: "FFFFFF" }, // Professional emerald green
    secondary: { bg: "0c4a6e", text: "FFFFFF" }, // Deep blue
    accent: { bg: "9333ea", text: "FFFFFF" }, // Premium purple
    success: { bg: "22c55e", text: "FFFFFF" }, // Success green
    warning: { bg: "f59e0b", text: "000000" }, // Warning amber with dark text
  };

  const colors = themeColors[theme];

  return createAvatarUrl({
    avatarUrl: name,
    additionalParams: {
      background: colors.bg,
      color: colors.text,
      size,
    },
  });
};
