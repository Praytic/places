import React from 'react';
import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react';

interface CustomEmojiPickerProps {
  onEmojiClick: (emojiData: EmojiClickData, event: MouseEvent) => void;
  width?: string | number;
  height?: string | number;
}

const CUSTOM_EMOJIS = [
  {
    names: ['pumpkin', 'halloween', 'trick or treat'],
    imgUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><text y="32" font-size="32">🎃</text></svg>',
    id: 'pumpkin'
  }
];

const CustomEmojiPicker: React.FC<CustomEmojiPickerProps> = ({
  onEmojiClick,
  width = '100%',
  height = 400
}) => {
  return (
    <EmojiPicker
      onEmojiClick={onEmojiClick}
      width={width}
      height={height}
      previewConfig={{ showPreview: false }}
      emojiStyle={EmojiStyle.NATIVE}
      skinTonesDisabled={true}
      customEmojis={CUSTOM_EMOJIS}
    />
  );
};

export default CustomEmojiPicker;