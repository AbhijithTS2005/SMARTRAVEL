<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmergencyContact;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EmergencyController extends Controller
{
    /**
     * Kerala Emergency Helplines
     */
    private const HELPLINES = [
        ['name' => 'Police', 'number' => '100', 'icon' => 'shield', 'category' => 'law'],
        ['name' => 'Ambulance', 'number' => '108', 'icon' => 'heart-pulse', 'category' => 'medical'],
        ['name' => 'Fire Station', 'number' => '101', 'icon' => 'flame', 'category' => 'fire'],
        ['name' => 'Tourist Helpline', 'number' => '1363', 'icon' => 'map-pin', 'category' => 'tourism'],
        ['name' => 'Women Helpline', 'number' => '181', 'icon' => 'phone', 'category' => 'safety'],
        ['name' => 'NDMA (Disaster)', 'number' => '1078', 'icon' => 'alert-triangle', 'category' => 'disaster'],
        ['name' => 'Child Helpline', 'number' => '1098', 'icon' => 'baby', 'category' => 'safety'],
        ['name' => 'Road Accident', 'number' => '1073', 'icon' => 'car', 'category' => 'accident'],
        ['name' => 'Kerala Police Helpline', 'number' => '112', 'icon' => 'shield-alert', 'category' => 'law'],
        ['name' => 'Anti-Poison Centre', 'number' => '1066', 'icon' => 'skull', 'category' => 'medical'],
    ];

    /**
     * List emergency contacts for the authenticated user.
     */
    public function contacts(Request $request): JsonResponse
    {
        $contacts = $request->user()
            ->emergencyContacts()
            ->orderByDesc('is_primary')
            ->orderBy('name')
            ->get();

        return response()->json($contacts);
    }

    /**
     * Add a new emergency contact (max 5).
     */
    public function storeContact(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'relationship' => 'nullable|string|max:50',
            'is_primary' => 'boolean',
        ]);

        $count = $request->user()->emergencyContacts()->count();
        if ($count >= 5) {
            return response()->json([
                'message' => 'Maximum 5 emergency contacts allowed.',
            ], 422);
        }

        // If setting as primary, unset others
        if ($request->input('is_primary', false)) {
            $request->user()->emergencyContacts()->update(['is_primary' => false]);
        }

        $contact = $request->user()->emergencyContacts()->create($request->only([
            'name', 'phone', 'relationship', 'is_primary',
        ]));

        return response()->json($contact, 201);
    }

    /**
     * Update an emergency contact.
     */
    public function updateContact(Request $request, int $id): JsonResponse
    {
        $contact = $request->user()->emergencyContacts()->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'phone' => 'sometimes|required|string|max:20',
            'relationship' => 'nullable|string|max:50',
            'is_primary' => 'boolean',
        ]);

        if ($request->input('is_primary', false)) {
            $request->user()->emergencyContacts()->where('id', '!=', $id)->update(['is_primary' => false]);
        }

        $contact->update($request->only(['name', 'phone', 'relationship', 'is_primary']));

        return response()->json($contact);
    }

    /**
     * Delete an emergency contact.
     */
    public function deleteContact(Request $request, int $id): JsonResponse
    {
        $contact = $request->user()->emergencyContacts()->findOrFail($id);
        $contact->delete();

        return response()->json(['message' => 'Contact deleted.']);
    }

    /**
     * Trigger SOS — logs the alert and returns emergency info.
     */
    public function triggerSOS(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = $request->user();
        $contacts = $user->emergencyContacts()->orderByDesc('is_primary')->get();

        // Log the SOS event
        \Log::critical('🚨 SOS TRIGGERED', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'timestamp' => now()->toISOString(),
            'emergency_contacts' => $contacts->pluck('phone', 'name')->toArray(),
        ]);

        return response()->json([
            'status' => 'sos_triggered',
            'message' => 'SOS alert has been logged. Please call emergency services immediately.',
            'timestamp' => now()->toISOString(),
            'location' => [
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude'),
            ],
            'helplines' => self::HELPLINES,
            'emergency_contacts' => $contacts,
        ]);
    }

    /**
     * Return helpline directory.
     */
    public function helplines(): JsonResponse
    {
        return response()->json([
            'helplines' => self::HELPLINES,
            'region' => 'Kerala, India',
        ]);
    }
}
