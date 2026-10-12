import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = SimpleConnectionPool(1, 5, os.environ["DATABASE_URL"])
    return _pool


def query(sql, params=None, one=False, commit=False):
    """Executa SQL e devolve lista de dicts (ou um dict se one=True)."""
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall() if cur.description else []
        if commit:
            conn.commit()
        return (rows[0] if rows else None) if one else rows
    except psycopg2.Error:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)
