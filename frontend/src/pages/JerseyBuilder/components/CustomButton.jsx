import React from 'react'
import { useSnapshot } from 'valtio';

import state from '../store';
import { getContrastingColor } from '../config/helpers'; // ChatGPT did this getContrastingColor

const CustomButton = ({ type, title, customStyles, handleClick }) => {
  const snap = useSnapshot(state);

// This function generates a style object based on the type of style required
const generateStyle = (type) => {
  const btnColor = snap.colors?.primary || snap.color || '#353934';
  
  if (type === 'filled') {
    // If the type is 'filled', return a style object with a background color and contrasting text color
    return {
      backgroundColor: btnColor,
      color: getContrastingColor(btnColor)
    };
  } else if (type === 'outline') {
    // If the type is 'outline', return a style object with a border and color
    return {
      borderWidth: '1px',
      borderColor: btnColor,
      color: btnColor
    };
  }
};

  return (
    <button
      className={`px-2 py-1.5 flex-1 rounded-md ${customStyles}`}
      style={generateStyle(type)}
      onClick={handleClick}
    >
      {title}
    </button>
  )
}

export default CustomButton