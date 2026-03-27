import React from 'react';

interface ChoiceHospital {
  code: string;
  name: string;
}

interface NhicChoiceHospitalFormProps {
  choiceHospitalList?: ChoiceHospital[];
}

const NhicChoiceHospitalForm: React.FC<NhicChoiceHospitalFormProps> = ({
  choiceHospitalList
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-md font-semibold text-gray-800 mb-2">선택요양기관정보</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700">순서</th>
              <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700">요양기관번호</th>
              <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700">요양기관명칭</th>
            </tr>
          </thead>
          <tbody>
            {choiceHospitalList?.map((hospital, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-xs text-center">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2 text-xs">{hospital.code}</td>
                <td className="border border-gray-300 px-4 py-2 text-xs">{hospital.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NhicChoiceHospitalForm; 