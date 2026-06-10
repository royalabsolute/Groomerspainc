import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = {
    width: 180,
    height: 180,
};
export const contentType = "image/png";

export default async function Icon() {
    const iconPath = path.join(process.cwd(), "public", "icon.png");
    const iconBuffer = fs.readFileSync(iconPath);
    const base64Icon = iconBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Icon}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ffffff",
                    borderRadius: "36px",
                    padding: "12px",
                }}
            >
                <img
                    src={dataUrl}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                    }}
                    alt="GroomingPet Apple Touch Icon"
                />
            </div>
        ),
        {
            ...size,
        }
    );
}
