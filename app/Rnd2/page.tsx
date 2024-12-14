'use client';
import React, { useState } from 'react';
import Select from 'react-select';
import { useQuery } from '@tanstack/react-query';

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

  // If countries are loading, show loading message
  if (isCountriesLoading) return <div>Loading countries...</div>;
  if (countriesError) return <div>Error loading countries: {countriesError.message}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Select Your Location</h2>

      {/* Parent container with Tailwind grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Country selection */}
        <div className="flex flex-col items-center space-x-2">
          <label htmlFor="country" className="block text-lg font-medium w-1/3">Country</label>
          <div className="w-2/3">
            <Select
              options={countries}
              value={selectedCountry}
              onChange={setSelectedCountry}
              placeholder="Select Country"
              isClearable
              isLoading={isCountriesLoading}
            />
          </div>
        </div>

        {/* State selection */}
        <div className="flex items-center space-x-2">
          <label htmlFor="state" className="block text-lg font-medium w-1/3">State</label>
          <div className="w-2/3">
            {isStatesLoading && <div>Loading states...</div>}
            {statesError && <div>Error loading states: {statesError.message}</div>}
            <Select
              options={states}
              value={selectedState}
              onChange={setSelectedState}
              placeholder="Select State"
              isDisabled={!selectedCountry || isStatesLoading || !states}
              isClearable
              isLoading={isStatesLoading}
            />
          </div>
        </div>

        {/* City selection */}
        <div className="flex items-center space-x-2">
          <label htmlFor="city" className="block text-lg font-medium w-1/3">City</label>
          <div className="w-2/3">
            {isCitiesLoading && <div>Loading cities...</div>}
            {citiesError && <div>Error loading cities: {citiesError.message}</div>}
            <Select
              options={cities}
              value={selectedCity}
              onChange={setSelectedCity}
              placeholder="Select City"
              isDisabled={!selectedState || isCitiesLoading || !cities}
              isClearable
              isLoading={isCitiesLoading}
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
  );
}
