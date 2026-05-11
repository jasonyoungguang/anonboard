package com.anonboard.family.service;

import com.anonboard.family.entity.FamilyMember;
import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.mapper.FamilyMemberMapper;
import com.anonboard.family.mapper.FamilyRelationshipMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FamilyMemberService {

    private final FamilyMemberMapper memberMapper;
    private final FamilyRelationshipMapper relationshipMapper;
    private final FamilyStoryService storyService;

    public FamilyMemberService(FamilyMemberMapper memberMapper,
                               FamilyRelationshipMapper relationshipMapper,
                               FamilyStoryService storyService) {
        this.memberMapper = memberMapper;
        this.relationshipMapper = relationshipMapper;
        this.storyService = storyService;
    }

    public List<FamilyMember> getAllMembers() {
        LambdaQueryWrapper<FamilyMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyMember::getIsDeleted, false);
        return memberMapper.selectList(wrapper);
    }

    public FamilyMember getById(Long id) {
        FamilyMember member = memberMapper.selectById(id);
        if (member != null && Boolean.TRUE.equals(member.getIsDeleted())) {
            return null;
        }
        return member;
    }

    public boolean addMember(FamilyMember member) {
        return memberMapper.insert(member) > 0;
    }

    public boolean updateMember(FamilyMember member) {
        return memberMapper.updateById(member) > 0;
    }

    @Transactional
    public boolean deleteMember(Long id) {
        // 删除该成员相关的所有关系（硬删除关系）
        LambdaQueryWrapper<FamilyRelationship> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.eq(FamilyRelationship::getMemberAId, id)
                  .or()
                  .eq(FamilyRelationship::getMemberBId, id);
        relationshipMapper.delete(relWrapper);
        // 软删除成员
        FamilyMember member = memberMapper.selectById(id);
        if (member == null) return false;
        member.setIsDeleted(true);
        return memberMapper.updateById(member) > 0;
    }

    @Transactional
    public boolean hardDeleteMember(Long id) {
        LambdaQueryWrapper<FamilyRelationship> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.eq(FamilyRelationship::getMemberAId, id)
                  .or()
                  .eq(FamilyRelationship::getMemberBId, id);
        relationshipMapper.delete(relWrapper);
        return memberMapper.deleteById(id) > 0;
    }

    public boolean restoreMember(Long id) {
        FamilyMember member = memberMapper.selectById(id);
        if (member == null) return false;
        member.setIsDeleted(false);
        return memberMapper.updateById(member) > 0;
    }

    public List<FamilyMember> getDeletedMembers() {
        LambdaQueryWrapper<FamilyMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyMember::getIsDeleted, true);
        return memberMapper.selectList(wrapper);
    }

    public List<FamilyMember> getMembersByGeneration(int generation) {
        LambdaQueryWrapper<FamilyMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyMember::getGeneration, generation)
               .eq(FamilyMember::getIsDeleted, false);
        return memberMapper.selectList(wrapper);
    }

    @Transactional
    public boolean addRelative(Long existingId, FamilyMember newMember, boolean isParent) {
        memberMapper.insert(newMember);

        FamilyRelationship rel = new FamilyRelationship();
        Long childId;
        if (isParent) {
            childId = existingId;
            rel.setMemberAId(newMember.getId());
            rel.setMemberBId(childId);

            // 检查孩子是否已有另一个异性父母，自动创建配偶关系
            createSpouseIfBothParentsExist(childId, newMember);
        } else {
            childId = newMember.getId();
            rel.setMemberAId(existingId);
            rel.setMemberBId(childId);
        }
        rel.setRelationType("parent-child");
        relationshipMapper.insert(rel);

        // 自动为所有父母生成/更新生育故事
        createChildbirthStoriesForParents(childId);

        return true;
    }

    /**
     * 为指定成员的所有父母创建/更新生育故事。
     * 当孩子有出生年份时，在每个父母的生平中自动添加。
     */
    public void createChildbirthStoriesForParents(Long childId) {
        FamilyMember child = memberMapper.selectById(childId);
        if (child == null || child.getBirthYear() == null) return;

        LambdaQueryWrapper<FamilyRelationship> parentQuery = new LambdaQueryWrapper<>();
        parentQuery.eq(FamilyRelationship::getMemberBId, childId)
                   .eq(FamilyRelationship::getRelationType, "parent-child");
        List<FamilyRelationship> parentRels = relationshipMapper.selectList(parentQuery);

        for (FamilyRelationship pr : parentRels) {
            storyService.createOrUpdateChildbirthStory(
                pr.getMemberAId(), child.getId(), child.getName(),
                child.getGender(), child.getBirthYear(), pr.getId()
            );
        }
    }

    /**
     * 同步指定成员的所有亲子关系对应的生育故事。
     * 在成员出生年份变动后调用，更新作为子女和作为父母两个方向的故事。
     */
    public void syncChildbirthStoriesForMember(Long memberId) {
        // 作为子女：更新所有父母的故事
        createChildbirthStoriesForParents(memberId);

        // 作为父母：更新所有子女对应的故事
        LambdaQueryWrapper<FamilyRelationship> childQuery = new LambdaQueryWrapper<>();
        childQuery.eq(FamilyRelationship::getMemberAId, memberId)
                  .eq(FamilyRelationship::getRelationType, "parent-child");
        List<FamilyRelationship> childRels = relationshipMapper.selectList(childQuery);

        for (FamilyRelationship cr : childRels) {
            FamilyMember child = memberMapper.selectById(cr.getMemberBId());
            if (child != null && child.getBirthYear() != null) {
                storyService.createOrUpdateChildbirthStory(
                    memberId, child.getId(), child.getName(),
                    child.getGender(), child.getBirthYear(), cr.getId()
                );
            }
        }
    }

    private void createSpouseIfBothParentsExist(Long childId, FamilyMember newParent) {
        LambdaQueryWrapper<FamilyRelationship> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyRelationship::getMemberBId, childId)
               .eq(FamilyRelationship::getRelationType, "parent-child");
        List<FamilyRelationship> parentRels = relationshipMapper.selectList(wrapper);

        for (FamilyRelationship pr : parentRels) {
            FamilyMember existingParent = memberMapper.selectById(pr.getMemberAId());
            if (existingParent != null
                && !existingParent.getId().equals(newParent.getId())
                && existingParent.getGender() != null
                && !existingParent.getGender().equals(newParent.getGender())) {
                FamilyRelationship spouseRel = new FamilyRelationship();
                spouseRel.setMemberAId(newParent.getId());
                spouseRel.setMemberBId(existingParent.getId());
                spouseRel.setRelationType("spouse");
                relationshipMapper.insert(spouseRel);
                break;
            }
        }
    }

    @Transactional
    public boolean addSpouse(Long existingId, FamilyMember spouse) {
        memberMapper.insert(spouse);

        FamilyRelationship rel = new FamilyRelationship();
        rel.setMemberAId(existingId);
        rel.setMemberBId(spouse.getId());
        rel.setRelationType("spouse");
        return relationshipMapper.insert(rel) > 0;
    }

    /**
     * 统计活跃成员信息
     */
    public StatsInfo getStats() {
        List<FamilyMember> activeMembers = getAllMembers();
        long maleCount = 0, femaleCount = 0, unknownGenderCount = 0;
        Integer minGen = null, maxGen = null;

        for (FamilyMember m : activeMembers) {
            if (m.getGender() == null || m.getGender() == 0) {
                unknownGenderCount++;
            } else if (m.getGender() == 1) {
                maleCount++;
            } else if (m.getGender() == 2) {
                femaleCount++;
            }
            if (m.getGeneration() != null) {
                if (minGen == null || m.getGeneration() < minGen) minGen = m.getGeneration();
                if (maxGen == null || m.getGeneration() > maxGen) maxGen = m.getGeneration();
            }
        }

        StatsInfo info = new StatsInfo();
        info.totalMembers = activeMembers.size();
        info.maleCount = maleCount;
        info.femaleCount = femaleCount;
        info.unknownGenderCount = unknownGenderCount;
        info.minGeneration = minGen;
        info.maxGeneration = maxGen;
        return info;
    }

    public static class StatsInfo {
        public long totalMembers;
        public long maleCount;
        public long femaleCount;
        public long unknownGenderCount;
        public Integer minGeneration;
        public Integer maxGeneration;
    }
}
