import React from 'react';
import { Wp } from '@/types/pages';
import { DeleteButton } from "../DeleteButton";
import { formatUnixTimestamp, formatUnixTimestampWpInterval } from '@/Utils/formatTimestamp';

const WPCard: React.FC<{ wp: Wp }> = ({ wp }) => {
  return (
    <div className="wp-card bg-gray-800 rounded-lg shadow-md p-4 mb-4">
        
        <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-gray-400 ">Work Package Entry</div>
              </div>
              <div className="flex items-center mb-2">
                  <div className="text-sm font-medium text-gray-400 mr-2">Title:</div>
                  <div className="text-sm font-semibold text-gray-200">{wp.title}</div>
              </div>
              <div className="items-center mb-2">
                  <div className="text-sm font-medium text-gray-400 mr-2">Intervals:</div>
                  <ul id="intervalList" className="list-disc pl-5">
                      {wp.activeIntervals.map((interval, index) => (
                          <li className="mb-1" key={index}>
                              <span className="text-sm font-medium text-gray-400 mr-2">Month of Project:</span> <span className="text-sm font-semibold text-gray-200">{interval.startDate}</span>
                              <br />
                              <span className="text-sm font-medium text-gray-400 mr-2">Duration:</span> <span className="text-sm font-semibold text-gray-200">{interval.duration}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
        <DeleteButton id={wp._id!} endpoint="wps"/>
    </div>
  );
};

export default WPCard;