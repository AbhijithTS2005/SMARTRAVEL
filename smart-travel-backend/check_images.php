<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$destinations = App\Models\Destination::select('id','name','images')
    ->orderBy('popularity_score','desc')
    ->limit(10)
    ->get();

foreach ($destinations as $d) {
    $imgs = $d->images;
    $count = is_array($imgs) ? count($imgs) : 0;
    $first = 'NONE';
    if (is_array($imgs) && !empty($imgs)) {
        $first = $imgs[0];
    }
    $hasHttp = str_starts_with($first, 'http') ? 'YES' : 'NO';
    echo "{$d->id} | {$d->name} | {$count} imgs | http={$hasHttp}" . PHP_EOL;
    if ($hasHttp === 'YES') {
        echo "   URL: " . substr($first, 0, 100) . PHP_EOL;
    } else {
        echo "   RAW: " . substr($first, 0, 100) . PHP_EOL;
    }
}
