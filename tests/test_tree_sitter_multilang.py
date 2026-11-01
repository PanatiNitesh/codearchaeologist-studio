import pytest
from backend.app.phase2_ast.tree_sitter_parser import TreeSitterASTParser

def test_tree_sitter_java_parsing():
    parser = TreeSitterASTParser()
    assert parser.is_supported(".java")

    java_code = """
package com.archaeo.billing;

import java.util.List;
import com.archaeo.common.Database;
import com.archaeo.models.Transaction;

public class PaymentGateway extends BaseGateway implements IPayment {
    private String apiKey;

    public boolean processPayment(String orderId, double amount) {
        Database.execute("UPDATE orders SET paid=1 WHERE id=" + orderId);
        return true;
    }

    public void refund(String transactionId) {
        Database.execute("REFUND " + transactionId);
    }
}
"""
    res = parser.parse("com/archaeo/billing/PaymentGateway.java", java_code)
    assert res is not None
    assert res["language"] == "java"
    assert res["parser_engine"] == "tree_sitter"

    # Verify imports
    import_sources = [imp["source"] for imp in res["imports"]]
    assert "com.archaeo.common.Database" in import_sources
    assert "com.archaeo.models.Transaction" in import_sources

    # Verify classes
    assert len(res["classes"]) == 1
    cls = res["classes"][0]
    assert cls["name"] == "PaymentGateway"
    assert cls["super_class"] == "BaseGateway"
    assert "IPayment" in cls["implements"]
    assert "PaymentGateway.processPayment" in cls["methods"]
    assert "PaymentGateway.refund" in cls["methods"]

    # Verify functions
    fn_names = [f["name"] for f in res["functions"]]
    assert "processPayment" in fn_names
    assert "refund" in fn_names

    # Verify calls
    assert any("Database.execute" in c for c in res["calls"])


def test_tree_sitter_go_parsing():
    parser = TreeSitterASTParser()
    assert parser.is_supported(".go")

    go_code = """
package main

import (
    "fmt"
    "net/http"
    "github.com/gin-gonic/gin"
)

type Router struct {
    port int
    routes map[string]string
}

func (r *Router) Register(path string) {
    fmt.Println(path)
}

func ProcessOrder(orderId string) error {
    fmt.Printf("Processing %s\\n", orderId)
    return nil
}

func main() {
    r := &Router{port: 8080}
    r.Register("/checkout")
    ProcessOrder("ord_123")
}
"""
    res = parser.parse("main.go", go_code)
    assert res is not None
    assert res["language"] == "go"
    assert res["parser_engine"] == "tree_sitter"

    # Verify imports
    import_sources = [imp["source"] for imp in res["imports"]]
    assert "fmt" in import_sources
    assert "github.com/gin-gonic/gin" in import_sources

    # Verify struct / types
    assert len(res["classes"]) == 1
    st = res["classes"][0]
    assert st["name"] == "Router"
    assert st["kind"] == "struct"

    # Verify functions & methods
    fn_names = [f["name"] for f in res["functions"]]
    assert "Register" in fn_names
    assert "ProcessOrder" in fn_names
    assert "main" in fn_names

    # Verify calls
    assert any("fmt.Println" in c or "Println" in c for c in res["calls"])
    assert any("Register" in c for c in res["calls"])
