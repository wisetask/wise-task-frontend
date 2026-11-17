export function downloadText(fileName: string, text: string, type: string) {
  const blob = new Blob([text], { type: type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
