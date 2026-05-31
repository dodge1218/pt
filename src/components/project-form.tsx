"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      repoUrl: optionalUrl(formData.get("repoUrl")),
      websiteUrl: optionalUrl(formData.get("websiteUrl")),
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to create project");
        setLoading(false);
        return;
      }

      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch {
      alert("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Project name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={200}
          placeholder="ProofTicket launch"
          className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={6}
          maxLength={5000}
          placeholder="What work belongs in this project?"
          className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none resize-y"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="repoUrl" className="block text-sm font-medium mb-2">
            Repo URL
          </label>
          <input
            id="repoUrl"
            name="repoUrl"
            type="url"
            placeholder="https://github.com/org/repo"
            className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium mb-2">
            Website URL
          </label>
          <input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://example.com"
            className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create project"}
        </button>
      </div>
    </form>
  );
}

function optionalUrl(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}
