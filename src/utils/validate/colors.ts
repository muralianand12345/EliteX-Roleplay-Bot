import Color from "color";

const ValidateColor = (inputColor: string): string | null => {
    try {
        const colorName = inputColor.toLowerCase().replace(/\s/g, "");
        const color = Color(colorName);
        return color.hex();
    } catch (error) {
        return null;
    }
};

export default ValidateColor;