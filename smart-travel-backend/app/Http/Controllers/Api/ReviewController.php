<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Get all reviews for a destination.
     */
    public function index(Request $request, $destinationId)
    {
        $reviews = Review::with('user:id,name')
            ->where('destination_id', $destinationId)
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = $reviews->avg('rating');

        return response()->json([
            'success' => true,
            'data' => [
                'reviews' => $reviews->map(fn($r) => [
                    'id' => $r->id,
                    'user' => [
                        'id' => $r->user->id,
                        'name' => $r->user->name,
                    ],
                    'rating' => $r->rating,
                    'comment' => $r->comment,
                    'is_own' => $request->user() ? $r->user_id === $request->user()->id : false,
                    'created_at' => $r->created_at->toIso8601String(),
                ]),
                'average_rating' => $avgRating ? round($avgRating, 1) : null,
                'total_reviews' => $reviews->count(),
            ],
        ]);
    }

    /**
     * Create or update a review for a destination.
     */
    public function store(Request $request, $destinationId)
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $review = Review::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'destination_id' => $destinationId,
            ],
            [
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => $review->wasRecentlyCreated ? 'Review submitted' : 'Review updated',
            'data' => $review,
        ], $review->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Delete own review for a destination.
     */
    public function destroy(Request $request, $destinationId)
    {
        $review = Review::where('user_id', $request->user()->id)
            ->where('destination_id', $destinationId)
            ->first();

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Review not found',
            ], 404);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted',
        ]);
    }
}
