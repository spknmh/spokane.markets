"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/admin/action-buttons";
import { slugify } from "@/lib/utils";

type TagWithCount = { id: string; name: string; slug: string; _count: { events: number } };
type FeatureWithCount = { id: string; name: string; slug: string; icon: string | null; _count: { events: number } };

interface CategoriesManagerProps {
  initialTags: TagWithCount[];
  initialFeatures: FeatureWithCount[];
}

export function CategoriesManager({
  initialTags,
  initialFeatures,
}: CategoriesManagerProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [features, setFeatures] = useState(initialFeatures);
  const [tagName, setTagName] = useState("");
  const [tagSlug, setTagSlug] = useState("");
  const [featureName, setFeatureName] = useState("");
  const [featureSlug, setFeatureSlug] = useState("");
  const [featureIcon, setFeatureIcon] = useState("");
  const [tagSubmitting, setTagSubmitting] = useState(false);
  const [featureSubmitting, setFeatureSubmitting] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<string | null>(null);

  const addTag = async () => {
    const name = tagName.trim();
    const slug = tagSlug.trim() || slugify(name);
    if (!name || !slug) return;
    setTagSubmitting(true);
    setTagError(null);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to add tag");
      }
      const newTag = await res.json();
      setTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      setTagName("");
      setTagSlug("");
      router.refresh();
    } catch (e) {
      setTagError(e instanceof Error ? e.message : "Failed to add tag");
    } finally {
      setTagSubmitting(false);
    }
  };

  const deleteTag = async (id: string) => {
    await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    setTags((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  };

  const addFeature = async () => {
    const name = featureName.trim();
    const slug = featureSlug.trim() || slugify(name);
    if (!name || !slug) return;
    setFeatureSubmitting(true);
    setFeatureError(null);
    try {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, icon: featureIcon.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to add feature");
      }
      const newFeature = await res.json();
      setFeatures((prev) => [...prev, newFeature].sort((a, b) => a.name.localeCompare(b.name)));
      setFeatureName("");
      setFeatureSlug("");
      setFeatureIcon("");
      router.refresh();
    } catch (e) {
      setFeatureError(e instanceof Error ? e.message : "Failed to add feature");
    } finally {
      setFeatureSubmitting(false);
    }
  };

  const deleteFeature = async (id: string) => {
    await fetch(`/api/admin/features/${id}`, { method: "DELETE" });
    setFeatures((prev) => prev.filter((f) => f.id !== id));
    router.refresh();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Event Types (Tags) */}
      <section className="rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold">Event Types</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What kind of event: Farmers Market, Craft Fair, Flea Market, etc.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            placeholder="Name (e.g. Farmers Market)"
            value={tagName}
            onChange={(e) => {
              setTagName(e.target.value);
              if (!tagSlug) setTagSlug(slugify(e.target.value));
            }}
            className="w-40"
          />
          <Input
            placeholder="Slug (auto)"
            value={tagSlug}
            onChange={(e) => setTagSlug(e.target.value)}
            className="w-32"
          />
          <Button
            size="sm"
            onClick={addTag}
            disabled={!tagName.trim() || tagSubmitting}
          >
            {tagSubmitting ? "Adding…" : "Add"}
          </Button>
        </div>
        {tagError && (
          <p className="mt-2 text-sm text-destructive">{tagError}</p>
        )}
        <ul className="mt-4 space-y-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span className="font-medium">{tag.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {tag.slug} · {tag._count.events} events
                </span>
                <DeleteButton
                  action={() => deleteTag(tag.id)}
                  title="Delete event type"
                  description={`Delete "${tag.name}"? Events using it will be updated.`}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Features & Amenities */}
      <section className="rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold">Features & Amenities</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Venue/event attributes: Indoor, WiFi Available, Power Available, etc.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            placeholder="Name (e.g. WiFi Available)"
            value={featureName}
            onChange={(e) => {
              setFeatureName(e.target.value);
              if (!featureSlug) setFeatureSlug(slugify(e.target.value));
            }}
            className="w-40"
          />
          <Input
            placeholder="Slug (auto)"
            value={featureSlug}
            onChange={(e) => setFeatureSlug(e.target.value)}
            className="w-32"
          />
          <Input
            placeholder="Icon (emoji)"
            value={featureIcon}
            onChange={(e) => setFeatureIcon(e.target.value)}
            className="w-20"
          />
          <Button
            size="sm"
            onClick={addFeature}
            disabled={!featureName.trim() || featureSubmitting}
          >
            {featureSubmitting ? "Adding…" : "Add"}
          </Button>
        </div>
        {featureError && (
          <p className="mt-2 text-sm text-destructive">{featureError}</p>
        )}
        <ul className="mt-4 space-y-2">
          {features.map((feature) => (
            <li
              key={feature.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span className="font-medium">
                {feature.icon && <span className="mr-1">{feature.icon}</span>}
                {feature.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {feature.slug} · {feature._count.events} events
                </span>
                <DeleteButton
                  action={() => deleteFeature(feature.id)}
                  title="Delete feature/amenity"
                  description={`Delete "${feature.name}"? Events using it will be updated.`}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
