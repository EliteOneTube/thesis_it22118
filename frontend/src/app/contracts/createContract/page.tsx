'use client'

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Contract, Human, Project, Wp } from '@/types/pages';

const NewContractPage: React.FC = () => {
  const [intervalStart, setIntervalStart] = useState('');
  const [intervalEnd, setIntervalEnd] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>();
  const [totalCost, setTotalCost] = useState<number>();
  const [selectedPerson, setSelectedPerson] = useState<Human>();
  const [selectedProject, setSelectedProject] = useState<Project>();
  const [selectedWorkPackages, setSelectedWorkPackages] = useState<string[]>([]);
  
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const wps: Wp[] = [];

    for (const wpId of selectedWorkPackages) {
      for (const wp of selectedProject!.wps) {
        if (wp._id === wpId) {
          wps.push(wp);
          break;
        }
      }
    }

    const newContract: Contract = {
      hourlyRate: hourlyRate!,
      totalCost: totalCost!,
      human: selectedPerson!,
      project: selectedProject!,
      wps: wps,
      duration: {
        startDate: String(new Date(intervalStart).getTime()),
        endDate: String(new Date(intervalEnd).getTime()),
      }
    }

    const res = await fetch('/api', { 
      method: 'POST', 
      body: JSON.stringify({"contract": newContract}), 
      headers: { 
          'Content-Type': 'application/json' 
      }
    });

    window.location.href = '/contracts';
  };

  const searchParams = useSearchParams()

  const humans: Human[] = JSON.parse(searchParams.get('humans')!);
  const projects: Project[] = JSON.parse(searchParams.get('projects')!);

  const handleProjectChange = (e: any) => {
    for(const project of projects) {
      if (project._id == e.target.value) {
        setSelectedProject(project);
        break;
      }
    }
  }

  const handleHumanChange = (e: any) => {
    for(const human of humans) {
      if (human._id == e.target.value) {
        setSelectedPerson(human);
        break;
      }
    }
  }

  const handleWorkPackageChange = (e: React.ChangeEvent<HTMLInputElement>, wpId: string) => {
    const isChecked = e.target.checked;
    setSelectedWorkPackages(prevSelected => {
      if (isChecked) {
        return [...prevSelected, wpId];
      } else {
        return prevSelected.filter(id => id !== wpId);
      }
    });
  };

  return (
    <div className="container mx-auto py-8 border border-gray-300 rounded-md shadow-md p-8 mt-2 bg-gray-800">
      <h1 className="text-3xl font-semibold mb-4">Create a New Contract</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <label htmlFor="intervalStart" className="block text-sm font-medium text-white-700">
                Start Date of Contract
              </label>
              <input
                type="date"
                id="intervalStart"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 text-black"
                value={intervalStart}
                onChange={(e) => setIntervalStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="intervalEnd" className="block text-sm font-medium text-white-700">
              End Date of Contract
              </label>
              <input
                type="date"
                id="intervalEnd"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 text-black"
                value={intervalEnd}
                onChange={(e) => setIntervalEnd(e.target.value)}
                required
              />
            </div>
          </div>
        
        <div className="mb-4">
          <label htmlFor="hourlyCost" className="block text-sm font-medium text-white">Hourly Rate:</label>
          <input type="number" id="hourlyCost" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 text-gray-900" />
        </div>

        <div className="mb-4">
          <label htmlFor="totalCost" className="block text-sm font-medium text-white">Total Cost:</label>
          <input type="number" id="totalCost" value={totalCost} onChange={(e) => setTotalCost(Number(e.target.value))} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 text-gray-900" />
        </div>

        <div className="mb-4">
          <label htmlFor="selectedPerson" className="block text-sm font-medium text-white">Select Person:</label>
          <select id="selectedPerson" value={selectedPerson ? selectedPerson._id : ''} onChange={handleHumanChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 text-gray-900">
            <option value="">Select Person</option>
            {humans.map((human: Human) => (
              <option key={human._id} value={human._id}>{human.lastName + ' ' + human.firstName}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="selectedProject" className="block text-sm font-medium text-white">Select Project:</label>
          <select id="selectedProject" value={selectedProject ? selectedProject._id : ''} onChange={handleProjectChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 text-gray-900">
            <option value="">Select Project</option>
            {projects.map((project: Project) => (
              <option key={project._id} value={project._id}>{project.title}</option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white">Select Work Packages:</label>
            {selectedProject.wps.map((wp: Wp) => (
              <div key={wp._id} className="flex items-center">
                <input type="checkbox" id={wp._id} checked={selectedWorkPackages.includes(wp._id!)} onChange={(e) => handleWorkPackageChange(e, wp._id!)} className="mr-2"/>
                <label htmlFor={wp._id} className="text-sm text-white">{wp.title}</label>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button type="button" onClick={() => router.push('/contracts')} className="w-1/2 px-4 py-2 bg-gray-300 text-white rounded-md hover:bg-gray-400 focus:outline-none focus:bg-gray-400">Cancel</button>
          <button type="submit" className="w-1/2 ml-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:bg-indigo-700">Create Contract</button>
        </div>
      </form>
    </div>
  );
};

export default NewContractPage;
