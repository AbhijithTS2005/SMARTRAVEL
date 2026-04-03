<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Alert - {{ $locationName }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            color: #333;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .header {
            padding: 30px 24px;
            text-align: center;
            color: #ffffff;
        }

        .header.severity-severe {
            background: linear-gradient(135deg, #d32f2f, #b71c1c);
        }

        .header.severity-high {
            background: linear-gradient(135deg, #f57c00, #e65100);
        }

        .header.severity-medium {
            background: linear-gradient(135deg, #ffa726, #fb8c00);
        }

        .header h1 {
            margin: 0 0 6px;
            font-size: 22px;
            font-weight: 700;
        }

        .header .subtitle {
            font-size: 14px;
            opacity: 0.9;
        }

        .severity-badge {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            background: rgba(255, 255, 255, 0.25);
            color: #fff;
        }

        .body-content {
            padding: 28px 24px;
        }

        .alert-message {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 14px 18px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 24px;
            font-size: 14px;
            line-height: 1.6;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a2e;
            margin: 0 0 14px;
            padding-bottom: 8px;
            border-bottom: 2px solid #f0f0f0;
        }

        .conditions-grid {
            display: table;
            width: 100%;
            margin-bottom: 24px;
        }

        .condition-row {
            display: table-row;
        }

        .condition-label,
        .condition-value {
            display: table-cell;
            padding: 10px 12px;
            font-size: 14px;
            border-bottom: 1px solid #f5f5f5;
        }

        .condition-label {
            font-weight: 600;
            color: #555;
            width: 40%;
        }

        .condition-value {
            color: #333;
        }

        .condition-value.danger {
            color: #d32f2f;
            font-weight: 600;
        }

        .condition-value.warning {
            color: #f57c00;
            font-weight: 600;
        }

        .alternatives-section {
            margin-top: 24px;
        }

        .alternative-card {
            background-color: #f1f8e9;
            border: 1px solid #c5e1a5;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 10px;
        }

        .alternative-card h4 {
            margin: 0 0 6px;
            font-size: 15px;
            color: #33691e;
        }

        .alternative-card p {
            margin: 0;
            font-size: 13px;
            color: #555;
            line-height: 1.5;
        }

        .cta-button {
            display: block;
            width: 240px;
            margin: 28px auto;
            padding: 14px 0;
            text-align: center;
            background: linear-gradient(135deg, #1976d2, #1565c0);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
        }

        .footer {
            text-align: center;
            padding: 20px 24px;
            background-color: #f9fafb;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #f0f0f0;
        }

        .footer a {
            color: #1976d2;
            text-decoration: none;
        }

        /* Alerts list */
        .alert-item {
            background: #ffebee;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 8px;
            font-size: 13px;
        }

        .alert-item .alert-type {
            font-weight: 600;
            color: #c62828;
        }

        .alert-item .alert-severity {
            display: inline-block;
            background: #d32f2f;
            color: #fff;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            margin-left: 8px;
        }
    </style>
</head>

<body>
    <div style="padding: 20px 10px;">
        <div class="email-wrapper">
            {{-- Header --}}
            <div class="header severity-{{ strtolower($severity) }}">
                <span class="severity-badge">{{ $severity }} Alert</span>
                <h1>⚠️ Travel Alert</h1>
                <div class="subtitle">{{ $locationName }}</div>
            </div>

            {{-- Body --}}
            <div class="body-content">
                {{-- Main alert message --}}
                @if($message)
                    <div class="alert-message">
                        {{ $message }}
                    </div>
                @endif

                {{-- Current Conditions --}}
                <h3 class="section-title">📊 Current Conditions</h3>
                <div class="conditions-grid">
                    @if(!empty($conditions['weather']))
                        <div class="condition-row">
                            <div class="condition-label">🌤 Weather</div>
                            <div class="condition-value">{{ ucfirst($conditions['weather']) }}</div>
                        </div>
                    @endif

                    @if(!empty($conditions['temperature']))
                        <div class="condition-row">
                            <div class="condition-label">🌡 Temperature</div>
                            <div class="condition-value">{{ $conditions['temperature'] }}°C</div>
                        </div>
                    @endif

                    @if(!empty($conditions['aqi']))
                        @php
                            $aqiValue = $conditions['aqi_value'] ?? 0;
                            $aqiClass = $aqiValue > 250 ? 'danger' : ($aqiValue > 180 ? 'warning' : '');
                        @endphp
                        <div class="condition-row">
                            <div class="condition-label">💨 Air Quality</div>
                            <div class="condition-value {{ $aqiClass }}">
                                {{ $conditions['aqi'] }}
                                @if($aqiValue)
                                    (AQI: {{ $aqiValue }})
                                @endif
                            </div>
                        </div>
                    @endif

                    @if(isset($conditions['rainfall']) && $conditions['rainfall'] > 0)
                        @php
                            $rainClass = $conditions['rainfall'] > 50 ? 'danger' : ($conditions['rainfall'] > 20 ? 'warning' : '');
                        @endphp
                        <div class="condition-row">
                            <div class="condition-label">🌧 Rainfall</div>
                            <div class="condition-value {{ $rainClass }}">{{ $conditions['rainfall'] }} mm/hr</div>
                        </div>
                    @endif
                </div>

                {{-- Weather Alerts --}}
                @if(!empty($conditions['alerts']))
                    <h3 class="section-title">🚨 Active Weather Alerts</h3>
                    @foreach($conditions['alerts'] as $alert)
                        <div class="alert-item">
                            <span class="alert-type">{{ $alert['type'] ?? 'Alert' }}</span>
                            <span class="alert-severity">{{ $alert['severity'] ?? 'Warning' }}</span>
                            @if(!empty($alert['description']))
                                <p style="margin: 6px 0 0; color: #555;">{{ $alert['description'] }}</p>
                            @endif
                        </div>
                    @endforeach
                @endif

                {{-- Safer Alternatives --}}
                @if(!empty($alternatives))
                    <div class="alternatives-section">
                        <h3 class="section-title">🏝 Safer Alternatives</h3>
                        @foreach($alternatives as $alt)
                            <div class="alternative-card">
                                <h4>{{ $alt['name'] ?? 'Unknown' }}</h4>
                                <p>
                                    @if(!empty($alt['district']))
                                        📍 {{ $alt['district'] }}
                                    @endif
                                    @if(!empty($alt['distance_km']))
                                        &nbsp;•&nbsp; {{ round($alt['distance_km'], 1) }} km away
                                    @endif
                                    @if(!empty($alt['category']))
                                        &nbsp;•&nbsp; {{ $alt['category'] }}
                                    @endif
                                </p>
                            </div>
                        @endforeach
                    </div>
                @endif

                {{-- CTA --}}
                <a href="{{ url('/travel-plans') }}" class="cta-button">
                    Review Your Travel Plans →
                </a>
            </div>

            {{-- Footer --}}
            <div class="footer">
                <p>This is an automated alert from <strong>SmarTravel</strong>.</p>
                <p>You received this because you have an active travel plan for {{ $locationName }}.</p>
            </div>
        </div>
    </div>
</body>

</html>