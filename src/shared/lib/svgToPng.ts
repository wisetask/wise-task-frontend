export function svgToPng(svg: string, width: number, height: number, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext("2d");
      if (context === null) {
        reject(new Error("Браузер не дал нарисовать картинку"));
        return;
      }
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob === null) {
          reject(new Error("Браузер не смог сохранить картинку"));
        } else {
          resolve(blob);
        }
      }, "image/png");
    };
    image.onerror = () => {
      reject(new Error("Не получилось открыть SVG"));
    };
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}
