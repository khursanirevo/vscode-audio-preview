import React from 'react';
import './InfoTable.css';

export interface AudioInfo {
  numChannels: number;
  sampleRate: number;
  fileSize: number;
  format: string;
  encoding: string;
  duration?: number;
}

export interface InfoTableProps {
  audioInfo: AudioInfo | null;
}

export function InfoTable({ audioInfo }: InfoTableProps) {
  if (!audioInfo) {
    return null;
  }

  const { numChannels, sampleRate, fileSize, format, encoding, duration } = audioInfo;

  const channels = numChannels === 1 ? 'mono' : numChannels === 2 ? 'stereo' : 'unsupported';

  const infoItems = [
    { name: 'encoding', value: encoding },
    { name: 'format', value: format },
    { name: 'number_of_channel', value: `${numChannels} ch (${channels})` },
    { name: 'sample_rate', value: `${sampleRate.toLocaleString()} Hz` },
    { name: 'file_size', value: `${fileSize.toLocaleString()} bytes` },
  ];

  // Add duration if available
  if (duration !== undefined) {
    infoItems.push({
      name: 'duration',
      value: duration.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' s',
    });
  }

  return (
    <table className="infoTable">
      <tbody>
        {infoItems.map((item) => (
          <tr key={item.name} className="infoTableRow">
            <td className="infoTableData">
              {item.name}
            </td>
            <td className={`infoTableData js-infoTableData-${item.name}`}>
              {item.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}