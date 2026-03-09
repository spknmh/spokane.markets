"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileJson, FileSpreadsheet } from "lucide-react";

export function DataImportExport() {
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importFormat, setImportFormat] = React.useState<"json" | "csv">("json");
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{
    venuesCreated: number;
    marketsCreated: number;
    eventsCreated: number;
    errors: string[];
  } | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportResult, setExportResult] = React.useState<{
    url: string;
    filename: string;
    counts: { venues: number; markets: number; events: number };
  } | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.set("file", importFile);
      formData.set("format", importFormat);
      const res = await fetch("/api/admin/data/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setImportResult(data);
      setImportFile(null);
    } catch (err) {
      setImportResult({
        venuesCreated: 0,
        marketsCreated: 0,
        eventsCreated: 0,
        errors: [err instanceof Error ? err.message : "Import failed"],
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportResult(null);
    try {
      const res = await fetch("/api/admin/data/export", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");
      setExportResult(data);
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      setExportResult({
        url: "",
        filename: "",
        counts: { venues: 0, markets: 0, events: 0 },
      });
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            JSON: full structure with venues, markets, events. CSV: venues only (name, address, city, state, zip, lat, lng).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={importFormat === "json"}
                    onChange={() => setImportFormat("json")}
                  />
                  <FileJson className="h-4 w-4" />
                  JSON
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={importFormat === "csv"}
                    onChange={() => setImportFormat("csv")}
                  />
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (venues)
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-file">File</Label>
              <Input
                id="import-file"
                type="file"
                accept={importFormat === "json" ? ".json" : ".csv"}
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" disabled={!importFile || importing}>
              {importing ? "Importing…" : "Import"}
            </Button>
          </form>
          {importResult && (
            <div className="rounded-lg border border-border p-3 text-sm space-y-1">
              <p>
                Created: {importResult.venuesCreated} venues, {importResult.marketsCreated} markets, {importResult.eventsCreated} events
              </p>
              {importResult.errors.length > 0 && (
                <div className="text-destructive">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc list-inside">
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>…and {importResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export / Backup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Export all events, markets, and venues to a JSON file. Saved to uploads/backups/ on the host.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export Backup"}
          </Button>
          {exportResult && exportResult.url && (
            <div className="rounded-lg border border-border p-3 text-sm space-y-1">
              <p>
                Exported {exportResult.counts.venues} venues, {exportResult.counts.markets} markets, {exportResult.counts.events} events
              </p>
              <a
                href={exportResult.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Download {exportResult.filename}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
