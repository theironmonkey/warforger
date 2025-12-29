document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fighterId = urlParams.get('_id');

    const fightersUrl = 'https://krisling049.github.io/warcry_data/fighters.json';
    const abilitiesUrl = 'https://krisling049.github.io/warcry_data/abilities.json';

    try {
        // Fetch fighters and abilities data
        const [fightersResponse, abilitiesResponse] = await Promise.all([
            fetch(fightersUrl),
            fetch(abilitiesUrl)
        ]);

        if (!fightersResponse.ok || !abilitiesResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const fighters = await fightersResponse.json();
        const abilitiesData = await abilitiesResponse.json();

        // Find the fighter by ID
        const fighter = fighters.find(f => f._id === fighterId);
        if (!fighter) {
            document.body.innerHTML = '<p>Error: Fighter not found.</p>';
            return;
        }

        // Dynamically update the title with the fighter's name
        document.title = `${fighter.name}`;

        // Determine matching abilities
        const matchingAbilities = abilitiesData.filter(ability => {
            const isUniversalOrMatchesWarband =
                ability.warband === 'universal' ||
                ability.warband === fighter.warband ||
                ability.warband === fighter.subfaction;

            const runemarksMatch =
                !ability.runemarks?.length ||
                (fighter.runemarks && ability.runemarks.every(mark => fighter.runemarks.includes(mark)));

            return isUniversalOrMatchesWarband && runemarksMatch;
        });

        // Create popovers for abilities
        const abilitiesWithPopovers = matchingAbilities.map(ability => {
            const cost = ability.cost !== undefined ? ability.cost : 'No information available';
            const description = ability.description || 'No information available';
            return `
                <span 
                    class="ability-name" 
                    data-bs-toggle="popover" 
                    data-bs-trigger="hover focus" 
                    data-bs-custom-class="ability-popover" 
                    data-bs-content="${description}" 
                    title="${ability.name} (${cost})">${ability.name} (${cost})</span>`;
        });
        const abilitiesDisplay = abilitiesWithPopovers.join(', ') || 'none';

        // Create weapons display
        const weaponsDisplay = fighter.weapons
            .map(weapon => `
                <tr>
                    <td>${weapon.runemark}</td>
                    <td>${weapon.min_range}-${weapon.max_range}</td>
                    <td>${weapon.attacks}</td>
                    <td>${weapon.strength}</td>
                    <td>${weapon.dmg_hit}</td>
                    <td>${weapon.dmg_crit}</td>
                </tr>
            `)
            .join('');

        // Display fighter details
        document.body.innerHTML = `
        <div class="card bg-dark opacity-75" style="--bs-bg-opacity: 0.85;">
            <div class="card-header">
                <h2>${fighter.name}</h2>
            </div>
            <div class="card-body">
                <p><b>Grand Alliance:</b> ${fighter.grand_alliance || 'none'}</p>
                <p><b>Warband:</b> ${(fighter.warband || 'none').toLowerCase()}</p>
                <p><b>Subfaction:</b> ${(fighter.subfaction || 'none').toLowerCase()}</p>
                <p><b>Runemarks:</b> ${fighter.runemarks?.join(', ') || 'none'}</p>
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Points</th>
                            <th>Movement</th>
                            <th>Toughness</th>
                            <th>Wounds</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${fighter.points || 'N/A'}</td>
                            <td>${fighter.movement || 'N/A'}</td>
                            <td>${fighter.toughness || 'N/A'}</td>
                            <td>${fighter.wounds || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>                
                <h3>Weapons</h3>
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Runemark</th>
                            <th>Range</th>
                            <th>Attack</th>
                            <th>Strength</th>
                            <th>Damage (Hit)</th>
                            <th>Damage (Crit)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${weaponsDisplay}
                    </tbody>
                </table>
                <h3>Fighter Specific Abilities</h3> 
                <p>${abilitiesDisplay}</p>
            </div>
        </div>
        `;

        // Initialize Bootstrap popovers
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList.forEach(el => {
        new bootstrap.Popover(el, {
            html: true,
            container: 'body'
        });
    });

    } catch (error) {
        console.error(error);
        document.body.innerHTML = '<p>Error: Failed to fetch fighter details.</p>';
    }
});