"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AddressAutofill } from "@mapbox/search-js-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export type AddressResult = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
};

interface AddressAutofillFieldsProps {
  /** Called when user selects an address (provides lat/lng for map) */
  onRetrieve?: (result: AddressResult) => void;
  /** Disable all inputs */
  disabled?: boolean;
  /** Additional class for container */
  className?: string;
  /** Street address input props (id, placeholder, register, etc.) */
  streetProps: React.ComponentProps<typeof Input>;
  /** City input props */
  cityProps: React.ComponentProps<typeof Input>;
  /** State input props */
  stateProps: React.ComponentProps<typeof Input>;
  /** Zip input props */
  zipProps: React.ComponentProps<typeof Input>;
}

/**
 * Address fields with Mapbox autofill. When NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is set,
 * the street input gets autocomplete; selecting a suggestion fills street, city, state, zip.
 * onRetrieve provides lat/lng for the selected address.
 */
export function AddressAutofillFields({
  onRetrieve,
  disabled = false,
  className,
  streetProps,
  cityProps,
  stateProps,
  zipProps,
}: AddressAutofillFieldsProps) {
  const handleRetrieve = React.useCallback(
    (res: { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }> }) => {
      const feature = res.features?.[0];
      if (!feature?.geometry?.coordinates || !onRetrieve) return;
      const [lng, lat] = feature.geometry.coordinates;
      // Mapbox fills the form; we only need lat/lng for map display
      onRetrieve({
        name: "Venue",
        address: "",
        city: "",
        state: "",
        zip: "",
        lat,
        lng,
      });
    },
    [onRetrieve]
  );

  const streetInput = (
    <Input
      {...streetProps}
      disabled={disabled}
      autoComplete="address-line1"
      placeholder={streetProps.placeholder ?? "Street address"}
    />
  );

  const cityInput = (
    <Input
      {...cityProps}
      disabled={disabled}
      autoComplete="address-level2"
      placeholder={cityProps.placeholder ?? "City"}
    />
  );

  const stateInput = (
    <Input
      {...stateProps}
      disabled={disabled}
      autoComplete="address-level1"
      placeholder={stateProps.placeholder ?? "State"}
    />
  );

  const zipInput = (
    <Input
      {...zipProps}
      disabled={disabled}
      autoComplete="postal-code"
      placeholder={zipProps.placeholder ?? "ZIP"}
    />
  );

  if (MAPBOX_TOKEN) {
    return (
      <div className={cn("space-y-2", className)}>
        <AddressAutofill
          accessToken={MAPBOX_TOKEN}
          options={{ country: "US" }}
          onRetrieve={handleRetrieve}
        >
          {streetInput}
        </AddressAutofill>
        <div className="grid grid-cols-3 gap-4">
          {cityInput}
          {stateInput}
          {zipInput}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {streetInput}
      <div className="grid grid-cols-3 gap-4">
        {cityInput}
        {stateInput}
        {zipInput}
      </div>
    </div>
  );
}
