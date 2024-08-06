"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { capitalizeFirstLetter } from "~~/utils/common/common";
import {
  DappRating,
  DappRegistered,
  fetchDappRatings,
  fetchGraphQLRegisteredDapps,
} from "~~/utils/graphQL/fetchFromSubgraph";

type RatingsMap = { [dappId: string]: number };

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dapps, setDapps] = useState<DappRegistered[] | undefined>(undefined);
  const [allDapps, setAllDapps] = useState<DappRegistered[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dappResult = await fetchGraphQLRegisteredDapps();
        let ratingsMap: RatingsMap = {};

        if (dappResult && dappResult.data) {
          try {
            const ratingsData = await fetchDappRatings();
            if (ratingsData && ratingsData.data) {
              console.log(ratingsData.data.dappRatingSubmitteds);
              ratingsMap = computeAverageRatings(ratingsData.data.dappRatingSubmitteds);
            }
          } catch (ratingsError) {
            console.error("Error fetching ratings:", ratingsError);
          }

          const enrichedDapps = dappResult.data.dappRegistereds.map(dapp => ({
            ...dapp,
            averageRating: ratingsMap[dapp.dappId] ?? 0,
          }));
          setAllDapps(enrichedDapps);
          setDapps(enrichedDapps);
        } else {
          setError("No DApp data returned");
        }
      } catch (err) {
        setError("An error occurred while fetching DApp data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filteredDapps = allDapps?.filter(dapp => dapp.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setDapps(filteredDapps);
  }, [searchTerm, allDapps]);

  function computeAverageRatings(submittedRatings: DappRating[]): RatingsMap {
    const ratings: RatingsMap = {};
    const counts: { [key: string]: number } = {};

    submittedRatings.forEach(({ dappId, starRating }) => {
      if (ratings[dappId]) {
        ratings[dappId] += starRating;
        counts[dappId] += 1;
      } else {
        ratings[dappId] = starRating;
        counts[dappId] = 1;
      }
    });

    for (const dappId in ratings) {
      ratings[dappId] = ratings[dappId] / counts[dappId];
    }

    return ratings;
  }

  const renderStars = (averageRating: number) => {
    const roundedRating = Math.round(averageRating);
    return [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < roundedRating ? "red" : "grey" }}>
        ★
      </span>
    ));
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Rate your experience with Web3!</span>
          </h1>
          <div className="text-center margin-top-20">
            <p className="block text-2xl my-2 font-medium">Search for a project:</p>
            <div className="flex justify-center items-center mt-4">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-4 py-2 border-2 border-red-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Display area for Dapps */}
        <div className="w-full px-5 mt-6">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : dapps && dapps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dapps
                .slice()
                .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
                .map(dapp => (
                  <div
                    key={dapp.dappId}
                    className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow flex flex-col items-center"
                  >
                    <h3 className="font-semibold text-lg text-center">{capitalizeFirstLetter(dapp.name)}</h3>
                    <p className="text-center mb-4">{dapp.description}</p>
                    <div className="text-red-500">{renderStars(dapp.averageRating ?? 0)}</div>
                    <div className="flex justify-between items-center w-full mt-2">
                      <a href={dapp.url} className="text-blue-500 hover:underline">
                        Visit Site
                      </a>
                      <a href={`/rate-dapp?id=${dapp.id}`} className="text-blue-500 hover:underline">
                        Rate This App
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center mt-4">
              <p>
                Can&apos;t find what you&apos;re looking for?{" "}
                <Link href="/register-project" className="text-red-500 hover:underline">
                  Register a new project
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
