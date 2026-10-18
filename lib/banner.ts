// Preserve existing saved settings while replacing the original default poster.
export const defaultBanner = "/hero-kangeyam-countryside.png";
export const bannerImage = (saved: string) =>
  saved === "/business-poster.png" ? defaultBanner : saved;
