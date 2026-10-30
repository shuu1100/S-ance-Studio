$src = "C:\Users\Asus\.gemini\antigravity-ide\brain\f9661bf2-a892-43a4-a628-a67b104eb298"
$dest = "c:\local_disc_D\Hackathan\week_4\frontend\public\assets"

function Copy-Single($pattern, $targetRel) {
    $found = Get-ChildItem -Path $src -Filter $pattern | Select-Object -First 1
    if ($found) {
        $target = Join-Path $dest $targetRel
        $parent = Split-Path -Parent $target
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
        Copy-Item -Path $found.FullName -Destination $target -Force
        Write-Host "Copied: $($found.Name) -> $targetRel"
    } else {
        Write-Warning "Not found: $pattern"
    }
}

Copy-Single "blackwood_manor_exterior_*.jpg" "environments\manor_exterior.jpg"
Copy-Single "grand_foyer_room_*.jpg" "environments\room_foyer.jpg"
Copy-Single "seance_parlor_room_*.jpg" "environments\room_seance.jpg"
Copy-Single "library_whispers_room_*.jpg" "environments\room_library.jpg"
Copy-Single "iron_conservatory_room_*.jpg" "environments\room_conservatory.jpg"
Copy-Single "vaulted_crypt_cellar_*.jpg" "environments\room_cellar.jpg"

Copy-Single "lady_eleanor_portrait_*.jpg" "characters\char_apparition.jpg"
Copy-Single "lady_eleanor_portrait_*.jpg" "characters\char_eleanor.jpg"
Copy-Single "arthur_briggs_portrait_*.jpg" "characters\char_caretaker.jpg"
Copy-Single "victoria_blackwood_portrait_*.jpg" "characters\char_daughter.jpg"
Copy-Single "lord_julian_portrait_*.jpg" "characters\char_julian.jpg"
Copy-Single "madame_vane_portrait_*.jpg" "characters\char_vane.jpg"

Copy-Single "silver_flask_clue_*.jpg" "clues\clue_silver_flask.jpg"

Write-Host "All assets successfully copied to frontend/public/assets!"
