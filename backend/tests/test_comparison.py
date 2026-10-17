import pytest

from backend.app.schemas.audit import AuditRequest, Competitor
from backend.app.services.comparison import compare_business, haversine_distance_m


def make_owner(**overrides):
    values = {"business_name": "Test Guest House", "business_category": "guest house", "location": "Assi Ghat, Varanasi", "google_rating": 4.0, "review_count": 100}
    values.update(overrides)
    return AuditRequest(**values)


def test_competitor_count_and_metric_comparisons():
    owner = make_owner()
    competitors = [Competitor(name="A", rating=4.5, review_count=200), Competitor(name="B", rating=3.5, review_count=100)]
    result = compare_business(owner, (25.3, 83.0), competitors)
    assert result.competitor_count == 2
    assert result.rating.competitor_average == 4.0
    assert result.rating.difference_from_average == 0.0
    assert result.review_count.competitor_average == 150.0
    assert result.review_count.difference_from_average == -50.0


def test_haversine_distance_for_known_coordinates():
    distance = haversine_distance_m(0, 0, 0, 1)
    assert distance == pytest.approx(111_195, rel=0.002)


def test_missing_metrics_are_not_fabricated():
    owner = make_owner(google_rating=None, review_count=None)
    result = compare_business(owner, (25.3, 83.0), [Competitor(name="A")])
    assert result.rating.status == "unavailable"
    assert result.review_count.status == "unavailable"
    assert result.distance.status == "unavailable"
    assert result.competitor_count == 1


def test_empty_competitor_list_is_safe():
    result = compare_business(make_owner(), (25.3, 83.0), [])
    assert result.competitor_count == 0
    assert result.rating.status == "unavailable"
    assert {item.id for item in result.evidence} == {"owner_rating", "owner_review_count"}


def test_distance_is_calculated_only_when_coordinates_exist():
    result = compare_business(
        make_owner(),
        (25.3, 83.0),
        [Competitor(name="With coords", latitude=25.31, longitude=83.01), Competitor(name="No coords")],
    )
    assert result.distance.status == "partial"
    assert result.distance.competitors_with_data == 1


def test_invalid_coordinate_is_rejected():
    with pytest.raises(ValueError):
        haversine_distance_m(91, 0, 0, 0)


def test_invalid_owner_rating_is_rejected():
    with pytest.raises(Exception):
        make_owner(google_rating=5.5)


def test_coordinates_must_be_provided_as_a_pair():
    with pytest.raises(Exception):
        make_owner(latitude=25.3)


def test_negative_review_count_is_rejected():
    with pytest.raises(Exception):
        make_owner(review_count=-1)