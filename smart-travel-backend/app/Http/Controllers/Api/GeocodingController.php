<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodingController extends Controller
{
    /**
     * Search for places using Nominatim API
     */
    public function search(Request $request)
    {
        $query = $request->input('q');

        if (!$query || strlen($query) < 3) {
            return response()->json([]);
        }

        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withHeaders([
                'User-Agent' => 'SmartTravelApp/1.0'
            ])->get('https://nominatim.openstreetmap.org/search', [
                        'q' => $query,
                        'format' => 'json',
                        'addressdetails' => 1,
                        'limit' => 5,
                        'accept_language' => 'en'
                    ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Nominatim API error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json(['error' => 'Geocoding service unavailable'], 503);

        } catch (\Exception $e) {
            Log::error('Geocoding search failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
