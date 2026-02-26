"""Management command: fetch and persist council vote data for Council Bills."""

import json

from django.core.management.base import BaseCommand

from server.legistar.models import Legislation, _fetch_action_details_for_legislation

# Bodies that represent a Full Council vote (lowercased)
_FULL_COUNCIL_BODIES = frozenset(
    {"full council", "seattle city council", "city council"}
)


class Command(BaseCommand):
    help = "Fetch and store individual council vote data for all Council Bills."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Re-fetch vote data even if already stored.",
        )

    def handle(self, *args, **options):
        force = options["force"]
        bills = Legislation.objects.filter(type__icontains="Council Bill")
        total = bills.count()
        self.stdout.write(f"Processing {total} Council Bill(s)...")

        fetched = 0
        skipped = 0

        for bill in bills:
            if not force and bill.vote_data.get("action_details"):
                skipped += 1
                continue

            # Only bother fetching if any row has a Full Council action
            has_full_council_vote = any(
                row.action_details is not None
                and row.result
                and any(
                    body in (row.action_by or "").lower()
                    for body in _FULL_COUNCIL_BODIES
                )
                for row in bill.crawl_data.rows
            )
            if not has_full_council_vote:
                skipped += 1
                continue

            self.stdout.write(f"  Fetching votes for {bill.record_no}...")
            try:
                # Fetch action details paired with the action_by from each row
                from server.legistar.lib.crawler import LegistarCalendarCrawler

                crawler = LegistarCalendarCrawler("seattle")
                paired = []
                for row in bill.crawl_data.rows:
                    if row.action_details is None or not row.result:
                        continue
                    if not any(
                        body in (row.action_by or "").lower()
                        for body in _FULL_COUNCIL_BODIES
                    ):
                        continue
                    action_data = crawler.get_action_for_legislation_row(row)
                    if action_data is not None:
                        paired.append(
                            {
                                "action_by": row.action_by or "",
                                "action": json.loads(action_data.json()),
                            }
                        )

                if paired:
                    bill.vote_data = {"action_details": paired}
                    bill.save(update_fields=["vote_data"])
                    fetched += 1
                    self.stdout.write(
                        f"    Saved {len(paired)} vote record(s) for {bill.record_no}."
                    )
                else:
                    skipped += 1
            except Exception as exc:
                self.stderr.write(
                    f"  Warning: could not fetch votes for {bill.record_no}: {exc}"
                )
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Fetched: {fetched}, Skipped/no votes: {skipped}"
            )
        )
