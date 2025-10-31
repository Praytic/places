import React from 'react';
import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react';

interface CustomEmojiPickerProps {
  onEmojiClick: (emojiData: EmojiClickData, event: MouseEvent) => void;
  width?: string | number;
  height?: string | number;
}

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
    />
  );
};

export default CustomEmojiPicker;
