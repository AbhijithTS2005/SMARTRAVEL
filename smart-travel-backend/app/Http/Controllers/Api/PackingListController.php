<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use Illuminate\Http\Request;

class PackingListController extends Controller
{
    /**
     * Generate a smart packing list based on destination characteristics.
     */
    public function generate(Request $request, $destinationId)
    {
        $destination = Destination::with(['activities', 'climateData'])->find($destinationId);

        if (!$destination) {
            return response()->json([
                'success' => false,
                'message' => 'Destination not found',
            ], 404);
        }

        $type = $destination->primary_type;
        $climate = $destination->climateData->first();
        $activities = $destination->activities->pluck('activity_type')->toArray();

        $packingList = [];

        // ── Essentials (always included) ──
        $packingList['essentials'] = [
            'label' => 'Essentials',
            'icon' => 'briefcase',
            'items' => [
                'ID / Passport',
                'Wallet & Cash',
                'Phone & Charger',
                'Power Bank',
                'Travel Insurance Documents',
                'Printed Itinerary',
                'First Aid Kit',
                'Medications',
                'Water Bottle',
                'Snacks',
            ],
        ];

        // ── Clothing (based on climate & type) ──
        $clothing = [
            'Comfortable Walking Shoes',
            'Socks (3-4 pairs)',
            'Undergarments',
            'Sleepwear',
        ];

        if ($climate && $climate->avg_temp_max > 30) {
            $clothing = array_merge($clothing, [
                'Light Cotton T-shirts',
                'Shorts',
                'Sunhat / Cap',
                'Sunglasses',
                'Light Sandals',
            ]);
        } elseif ($climate && $climate->avg_temp_min < 15) {
            $clothing = array_merge($clothing, [
                'Warm Jacket / Fleece',
                'Thermal Innerwear',
                'Beanie / Woolly Hat',
                'Gloves',
                'Warm Socks',
                'Full-length Pants',
            ]);
        } else {
            $clothing = array_merge($clothing, [
                'Light Jacket / Hoodie',
                'T-shirts',
                'Casual Pants / Jeans',
                'Light Scarf',
            ]);
        }

        $packingList['clothing'] = [
            'label' => 'Clothing',
            'icon' => 'shirt',
            'items' => $clothing,
        ];

        // ── Toiletries ──
        $packingList['toiletries'] = [
            'label' => 'Toiletries',
            'icon' => 'droplets',
            'items' => [
                'Toothbrush & Toothpaste',
                'Shampoo & Conditioner',
                'Soap / Body Wash',
                'Deodorant',
                'Sunscreen (SPF 50+)',
                'Insect Repellent',
                'Wet Wipes',
                'Hand Sanitizer',
                'Lip Balm',
                'Towel (quick dry)',
            ],
        ];

        // ── Electronics ──
        $packingList['electronics'] = [
            'label' => 'Electronics',
            'icon' => 'smartphone',
            'items' => [
                'Phone Charger & Cable',
                'Power Bank (10000mAh+)',
                'Camera',
                'Earphones / Headphones',
                'Travel Adapter',
            ],
        ];

        // ── Weather-Specific ──
        $weatherItems = [];
        if ($climate) {
            if ($climate->rainfall_mm > 100) {
                $weatherItems = array_merge($weatherItems, [
                    'Rain Jacket / Poncho',
                    'Waterproof Bag Cover',
                    'Umbrella',
                    'Waterproof Shoes / Sandals',
                ]);
            }
            if ($climate->avg_temp_max > 35) {
                $weatherItems = array_merge($weatherItems, [
                    'Cooling Towel',
                    'Extra Water Bottles',
                    'Electrolyte Packets',
                ]);
            }
            if ($climate->avg_aqi > 100) {
                $weatherItems[] = 'N95 Masks (poor air quality area)';
            }
        }
        if (!empty($weatherItems)) {
            $packingList['weather'] = [
                'label' => 'Weather Preparedness',
                'icon' => 'cloud-rain',
                'items' => $weatherItems,
            ];
        }

        // ── Activity-Specific ──
        $activityItems = [];

        if ($type === 'beach' || in_array('water_sports', $activities)) {
            $activityItems = array_merge($activityItems, [
                'Swimsuit',
                'Beach Towel',
                'Waterproof Phone Pouch',
                'Flip Flops',
                'Snorkeling Gear (optional)',
            ]);
        }

        if ($type === 'adventure' || in_array('trekking', $activities)) {
            $activityItems = array_merge($activityItems, [
                'Trekking Shoes (broken in)',
                'Trekking Poles',
                'Backpack (day pack)',
                'Headlamp / Flashlight',
                'Energy Bars',
                'Knee Support',
            ]);
        }

        if ($type === 'hill_station') {
            $activityItems = array_merge($activityItems, [
                'Warm Layers',
                'Thermos / Hot Flask',
                'Binoculars',
                'Hiking Boots',
            ]);
        }

        if ($type === 'wildlife' || in_array('wildlife_viewing', $activities)) {
            $activityItems = array_merge($activityItems, [
                'Binoculars',
                'Telephoto Camera Lens',
                'Camouflage / Neutral Clothing',
                'Field Guide Book',
            ]);
        }

        if ($type === 'cultural') {
            $activityItems = array_merge($activityItems, [
                'Modest Clothing (temple visits)',
                'Notebook & Pen',
                'Phrasebook / Language App',
            ]);
        }

        if (in_array('camping', $activities)) {
            $activityItems = array_merge($activityItems, [
                'Tent (if not provided)',
                'Sleeping Bag',
                'Camp Stove & Lighter',
                'Headlamp',
                'Insect Repellent (extra)',
            ]);
        }

        if (in_array('photography', $activities)) {
            $activityItems = array_merge($activityItems, [
                'Camera Tripod',
                'Extra Memory Cards',
                'Lens Cleaning Kit',
                'Camera Rain Cover',
            ]);
        }

        if (!empty($activityItems)) {
            $packingList['activities'] = [
                'label' => 'Activity Gear',
                'icon' => 'compass',
                'items' => array_unique($activityItems),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'destination' => [
                    'id' => $destination->id,
                    'name' => $destination->name,
                    'primary_type' => $destination->primary_type,
                    'district' => $destination->district,
                ],
                'packing_list' => $packingList,
            ],
        ]);
    }
}
