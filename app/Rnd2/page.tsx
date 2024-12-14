'use client';
import React, { useState } from 'react';
import Select from 'react-select';
import { useQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react'; // Import the LoaderCircle icon

// Define types for country, state, and city options
interface Country {
  value: string;
  label: string;
}

interface State {
  value: string;
  label: string;
}

interface City {
  value: string;
  label: string;
}

// Fetch countries
const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch('https://countriesnow.space/api/v0.1/countries');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.data.map((country: { country: string }) => ({
    value: country.country,
    label: country.country,
  }));
};

// Fetch states
const fetchStates = async (country: string): Promise<State[]> => {
  if (!country) return [];

  const response = await fetch(`https://countriesnow.space/api/v0.1/countries/states`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country }),
  });

  const data = await response.json();
  return data.data.states.map((state: { name: string }) => ({
    value: state.name,
    label: state.name,
  }));
};

// Fetch cities
const fetchCities = async (country: string, state: string): Promise<City[]> => {
  if (!country || !state) return [];

  const response = await fetch(`https://countriesnow.space/api/v0.1/countries/state/cities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, state }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data.map((city: string) => ({
    value: city,
    label: city,
  }));
};

export default function Rnd2() {
  // State for selected country, state, and city
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Fetch countries
  const { isLoading: isCountriesLoading, error: countriesError, data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60, // Cache data for 1 hour
  });

  // Fetch states when a country is selected
  const { isLoading: isStatesLoading, error: statesError, data: states } = useQuery({
    queryKey: ['states', selectedCountry?.value],
    queryFn: () => fetchStates(selectedCountry?.value || ''),
    enabled: !!selectedCountry, // Only fetch if a country is selected
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Fetch cities when both country and state are selected
  const { isLoading: isCitiesLoading, error: citiesError, data: cities } = useQuery({
    queryKey: ['cities', selectedCountry?.value, selectedState?.value],
    queryFn: () => fetchCities(selectedCountry?.value || '', selectedState?.value || ''),
    enabled: !!selectedState && !!selectedCountry, // Only fetch if both country and state are selected
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const isLoading = isCountriesLoading || isStatesLoading || isCitiesLoading;

  return (
    <div className="w-full min-h-screen flex justify-center items-center p-6 relative">
      {/* Overlay Spinner */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <LoaderCircle className="animate-spin text-white" size={48} />
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">Select Your Location</h2>

        {/* Child container with form inputs */}
        <div className="space-y-6">
          {/* Country selection */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <label htmlFor="country" className="text-lg font-medium">Country</label>
            <div className="col-span-2">
              <Select
                options={countries}
                value={selectedCountry}
                onChange={setSelectedCountry}
                placeholder="Select Country"
                isClearable
              />
            </div>
          </div>

          {/* State selection */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <label htmlFor="state" className="text-lg font-medium">State</label>
            <div className="col-span-2">
              <Select
                options={states}
                value={selectedState}
                onChange={setSelectedState}
                placeholder="Select State"
                isDisabled={!selectedCountry || isStatesLoading || !states}
                isClearable
              />
            </div>
          </div>

          {/* City selection */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <label htmlFor="city" className="text-lg font-medium">City</label>
            <div className="col-span-2">
              <Select
                options={cities}
                value={selectedCity}
                onChange={setSelectedCity}
                placeholder="Select City"
                isDisabled={!selectedState || isCitiesLoading || !cities}
                isClearable
              />
            </div>
          </div>
        </div>

        {/* Display selected location */}
        {selectedCity && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Selected Location:</h3>
            <p className="text-lg">Country: {selectedCountry?.label}</p>
            <p className="text-lg">State: {selectedState?.label}</p>
            <p className="text-lg">City: {selectedCity?.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}
