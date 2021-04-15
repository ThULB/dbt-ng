export const preloadImage = (url: string, anImageLoadedCallback: () => void): HTMLImageElement => {
  const img = new Image();

  img.onload = anImageLoadedCallback;
  img.src = url;

  return img;
};

export const preloadImages = (urls: Array<string>, allImagesLoadedCallback: (images: Array<HTMLImageElement>) => void) => {
  const imgs: Array<HTMLImageElement> = [];
  let loadedCounter = 0;
  const toBeLoadedNumber = urls.length;

  urls.forEach((url) => {
    imgs.push(preloadImage(url, () => {
      loadedCounter++;
      if (loadedCounter === toBeLoadedNumber) {
        allImagesLoadedCallback(imgs);
      }
    }));
  });
};
