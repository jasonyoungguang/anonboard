-- 创建数据库
CREATE DATABASE IF NOT EXISTS family_tree DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE family_tree;

-- 家族成员表
CREATE TABLE IF NOT EXISTS family_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    gender TINYINT DEFAULT 0 COMMENT '性别: 0-未知 1-男 2-女',
    birth_year INT COMMENT '出生年份',
    death_year INT COMMENT '逝世年份',
    generation INT COMMENT '辈分（数字越小辈分越高）',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    bio TEXT COMMENT '个人简介',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 亲属关系表
CREATE TABLE IF NOT EXISTS family_relationship (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_a_id BIGINT NOT NULL COMMENT '人物A',
    member_b_id BIGINT NOT NULL COMMENT '人物B',
    relation_type VARCHAR(20) NOT NULL COMMENT '关系: parent-child, spouse',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_a_id) REFERENCES family_member(id) ON DELETE CASCADE,
    FOREIGN KEY (member_b_id) REFERENCES family_member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 生平事迹表
CREATE TABLE IF NOT EXISTS family_story (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL COMMENT '所属人物',
    title VARCHAR(200) NOT NULL COMMENT '事迹标题',
    content TEXT COMMENT '事迹内容',
    story_year INT COMMENT '发生年份',
    story_month INT COMMENT '发生月份',
    category VARCHAR(50) COMMENT '分类: 出生, 求学, 工作, 婚嫁, 荣誉...',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-待审核 1-已通过 2-已驳回',
    submitter_name VARCHAR(50) COMMENT '提交人姓名',
    reviewer_id BIGINT COMMENT '审核人ID',
    review_comment VARCHAR(500) COMMENT '审核意见',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME COMMENT '审核时间',
    FOREIGN KEY (member_id) REFERENCES family_member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
