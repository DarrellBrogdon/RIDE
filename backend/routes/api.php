<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\ReceiptController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// API v1 routes
Route::prefix('v1')->group(function () {

    // Authentication routes (public)
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);

        // Protected auth routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/user', [AuthController::class, 'user']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
            Route::put('/password', [AuthController::class, 'updatePassword']);
            Route::delete('/account', [AuthController::class, 'deleteAccount']);
        });
    });

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // Receipt routes
        Route::prefix('receipts')->group(function () {
            Route::post('/upload', [ReceiptController::class, 'upload']);
            Route::get('/', [ReceiptController::class, 'index']);
            Route::get('/export', [ExportController::class, 'export']);
            Route::get('/{id}', [ReceiptController::class, 'show']);
            Route::get('/{id}/image', [ReceiptController::class, 'image']);
            Route::put('/{id}', [ReceiptController::class, 'update']);
            Route::delete('/{id}', [ReceiptController::class, 'destroy']);
        });
    });
});
