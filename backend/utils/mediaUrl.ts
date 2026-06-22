import { Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const getPrimaryHeaderValue = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const firstValue = value.split(",")[0]?.trim();
  return firstValue || undefined;
};

const toPathLikeUrl = (value: string): string => {
  return value.startsWith("/") ? value : `/${value}`;
};

const normalizeLocalAbsoluteUrl = (value: string): string => {
  if (!/^https?:\/\//i.test(value)) return toPathLikeUrl(value);

  try {
    const parsed = new URL(value);
    if (LOCAL_HOSTS.has(parsed.hostname)) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return value;
  }

  return value;
};

const getRequestOrigin = (req: Request): string | null => {
  const forwardedProto = getPrimaryHeaderValue(req.get("x-forwarded-proto"));
  const forwardedHost = getPrimaryHeaderValue(req.get("x-forwarded-host"));

  if (forwardedHost) {
    return `${forwardedProto || req.protocol || "http"}://${forwardedHost}`;
  }

  const host = req.get("host");
  if (!host) return null;
  return `${forwardedProto || req.protocol || "http"}://${host}`;
};

export const resolveMediaUrl = (req: Request, url: string | null | undefined): string | null => {
  if (!url) return null;

  const trimmed = String(url).trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) return trimmed;

  const normalized = normalizeLocalAbsoluteUrl(trimmed);
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const origin = getRequestOrigin(req);
  const pathLikeUrl = toPathLikeUrl(normalized);
  return origin ? `${origin}${pathLikeUrl}` : pathLikeUrl;
};
