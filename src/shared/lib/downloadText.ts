import { downloadBlob } from "./downloadBlob";

export function downloadText(fileName: string, text: string, type: string) {
  downloadBlob(fileName, new Blob([text], { type: type }));
}
