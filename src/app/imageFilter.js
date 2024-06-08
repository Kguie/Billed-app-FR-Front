export const imageFilter = (file) => {
  const fileTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!(file && fileTypes.includes(file.type))) {
    return 0;
  }
  return 1;
};
