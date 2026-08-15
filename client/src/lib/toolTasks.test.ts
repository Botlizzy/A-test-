import { describe, expect, it } from "vitest";
import { fieldLabel, functionalMode, isImageUrl, isVideoUrl, taskDescription, taskTitle } from "./toolTasks";

describe("functional ToolHub tasks", () => {
  it("maps endpoint families to the work users expect", () => {
    expect(functionalMode({ category: "download", alias: "Video downloader", path: "/download", tags: [] })).toBe("downloader");
    expect(taskTitle({ category: "imagegen", alias: "Image", path: "/image", tags: [] })).toBe("Generate an image");
    expect(taskDescription({ category: "search", alias: "Search", path: "/search", tags: [] })).toContain("receive the result");
  });

  it("uses task language for inputs and recognizes returned media", () => {
    expect(fieldLabel("url", "downloader")).toBe("Paste your video, image, or file URL");
    expect(fieldLabel("prompt", "ai")).toBe("Describe what you want");
    expect(isVideoUrl("https://cdn.example.com/result.mp4")).toBe(true);
    expect(isImageUrl("https://cdn.example.com/result.png")).toBe(true);
  });
});
