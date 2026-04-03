<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    /**
     * Get all wishlisted destinations for the authenticated user.
     */
    public function index(Request $request)
    {
        $wishlists = Wishlist::with('destination')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $wishlists->map(fn($w) => [
                'id' => $w->id,
                'destination' => $w->destination,
                'added_at' => $w->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Toggle a destination in the wishlist (add/remove).
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'destination_id' => 'required|exists:destinations,id',
        ]);

        $userId = $request->user()->id;
        $destinationId = $request->destination_id;

        $existing = Wishlist::where('user_id', $userId)
            ->where('destination_id', $destinationId)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'success' => true,
                'message' => 'Removed from wishlist',
                'wishlisted' => false,
            ]);
        }

        Wishlist::create([
            'user_id' => $userId,
            'destination_id' => $destinationId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Added to wishlist',
            'wishlisted' => true,
        ]);
    }

    /**
     * Check if a destination is in the user's wishlist.
     */
    public function check(Request $request, $destinationId)
    {
        $exists = Wishlist::where('user_id', $request->user()->id)
            ->where('destination_id', $destinationId)
            ->exists();

        return response()->json([
            'success' => true,
            'wishlisted' => $exists,
        ]);
    }
}
