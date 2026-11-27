import pytest

from app.phonemes import evaluate_guess, tokenize, validate_phonemes


def test_tokenize_spaced_and_unbroken():
    assert tokenize("/tʃ ɪ n/") == (["tʃ", "ɪ", "n"], [])
    assert tokenize("tʃɪn")[0] == ["tʃ", "ɪ", "n"]
    assert tokenize("b i: t")[0] == ["b", "iː", "t"]  # ':' normalised to the length mark


def test_tokenize_reports_unknown():
    phonemes, unknown = tokenize("bQt")
    assert unknown == ["Q"]


def test_validate_rejects_non_hce():
    with pytest.raises(ValueError, match="not an HCE sound"):
        validate_phonemes(["b", "x", "t"])
    assert validate_phonemes(["r", "ɪ", "d"]) == ["ɹ", "ɪ", "d"]


@pytest.mark.parametrize(
    ("guess", "target", "expected"),
    [
        (["θ", "ɪ", "n"], ["θ", "ɪ", "n"], ["correct"] * 3),
        (["n", "ɪ", "θ"], ["θ", "ɪ", "n"], ["present", "correct", "present"]),
        # repeated phoneme: only one 'b' left to match after the exact hit
        (["b", "b", "b"], ["b", "ɐ", "d"], ["correct", "absent", "absent"]),
    ],
)
def test_evaluate_guess(guess, target, expected):
    assert evaluate_guess(guess, target) == expected
