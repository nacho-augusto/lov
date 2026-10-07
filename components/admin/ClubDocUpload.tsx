"use client";

import { prepareDocumentUpload, registerDocumentFile } from "@/app/admin/(panel)/documentos/actions";
import { SignedUpload } from "./SignedUpload";

// Sets or replaces the file of a club document.
export function ClubDocUpload({ documentId, label }: { documentId: string; label: string }) {
  return (
    <SignedUpload
      bucket="club-documents"
      label={label}
      prepare={(fileName) => prepareDocumentUpload(documentId, fileName)}
      register={(f) => registerDocumentFile(documentId, f)}
    />
  );
}
